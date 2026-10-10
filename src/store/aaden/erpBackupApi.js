// 门店数据库备份：走云端 ERP 的「备份监控」接口，需要 ERP 登录（超管 / 财务 / 客服角色）。
// 原来用的匿名接口 GET /api/backups?id= 会被删掉：备份是整库数据，不能谁都能拿到。
import {baseUrl} from "./cloud-v2-api";
import IKUtils from "innerken-js-utils";

const TOKEN_KEY = 'erpToken'
const EMAIL_KEY = 'erpEmail'

export const ERP_BACKUP_PAGE = 'https://erp.aaden.io/compliance/backups'

export class ErpAuthError extends Error {
}

export function getErpToken() {
    return localStorage.getItem(TOKEN_KEY)
}

export function getErpEmail() {
    return localStorage.getItem(EMAIL_KEY) ?? ''
}

export function logoutErp() {
    localStorage.removeItem(TOKEN_KEY)
}

async function errorMessage(res, fallback) {
    // 云端有的回 JSON（{message} / {error}），有的直接回纯文本（如 "Main User Occupied"），两种都要显示出来
    let text = ''
    try {
        text = (await res.text()).trim()
    } catch {
        return fallback
    }
    if (!text) return fallback
    try {
        const body = JSON.parse(text)
        return body?.message || body?.error || fallback
    } catch {
        return text.slice(0, 200)
    }
}

/** 发登录验证码到邮箱；邮箱没有 ERP 角色时云端回 403 */
export async function sendErpOtp(email) {
    const res = await fetch(baseUrl + 'erp/auth/send-otp/' + encodeURIComponent(email.trim()), {method: 'POST'})
    if (!res.ok) throw new Error(await errorMessage(res, '发送验证码失败'))
    localStorage.setItem(EMAIL_KEY, email.trim())
}

export async function loginErp(email, otp) {
    const res = await fetch(baseUrl + 'erp/auth/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email: email.trim(), otp: otp.trim()}),
    })
    if (!res.ok) throw new Error(await errorMessage(res, '登录失败'))
    const body = await res.json()
    const token = body?.tokenValue ?? body?.data?.tokenValue
    if (!token) throw new Error('登录失败：云端没有返回 token')
    localStorage.setItem(TOKEN_KEY, token)
}

async function erpFetch(path) {
    const token = getErpToken()
    if (!token) throw new ErpAuthError('请先登录 ERP')
    const res = await fetch(baseUrl + path, {headers: {satoken: token}})
    if (res.status === 401 || res.status === 403) {
        logoutErp()
        throw new ErpAuthError(await errorMessage(res, 'ERP 登录已失效或没有权限，请重新登录'))
    }
    if (!res.ok) throw new Error(await errorMessage(res, '请求失败'))
    return res
}

/** 这台设备云端现存的备份（新→旧）和近 30 天上传失败 */
export async function getDeviceBackups(deviceId) {
    const res = await erpFetch(`erp/compliance/tenants/backups/devices/${encodeURIComponent(deviceId)}?days=30`)
    return await res.json()
}

/** 下载一份备份（整库 .sql.gz，可能上百 MB），云端会记录下载人 */
export async function downloadBackup(backup) {
    const res = await erpFetch(`erp/compliance/tenants/backups/files/${backup.id}/download`)
    const url = URL.createObjectURL(await res.blob())
    const a = document.createElement('a')
    a.href = url
    a.download = backup.fileName || `backup-${backup.id}.sql.gz`
    document.body.append(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
}

/**
 * 门店绑定操作（邀请、绑定、解绑、设主账号）：走云端 /erp/store-bindings，需要 ERP 登录且有超级管理员或客服角色。
 * 原来用的 /user-bl、/user-stores 是匿名接口，能被拿来冒充店主，云端在收口。
 * 失败时先弹提示再抛出：dialogStore.waitFor 遇到异常会保持弹窗不关，不会看起来像成功了。
 */
export async function erpStoreBindingPost(path, {query, body} = {}) {
    const token = getErpToken()
    if (!token) fail('请先登录 ERP（设备详情页里的「ERP 登录」），账号需要有超级管理员或客服角色')
    const qs = query ? '?' + new URLSearchParams(query).toString() : ''
    const res = await fetch(baseUrl + 'erp/store-bindings/' + path + qs, {
        method: 'POST',
        headers: body ? {satoken: token, 'Content-Type': 'application/json'} : {satoken: token},
        body: body ? JSON.stringify(body) : undefined,
    })
    if (res.status === 401) {
        logoutErp()
        fail('ERP 登录已失效，请重新登录')
    }
    if (res.status === 403) fail('这个 ERP 账号没有门店绑定权限（需要超级管理员或客服角色）')
    if (!res.ok) fail(await errorMessage(res, '操作失败'))
    return await res.text()
}

function fail(message) {
    IKUtils.showError(message)
    throw new Error(message)
}
