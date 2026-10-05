// 门店数据库备份：走云端 ERP 的「备份监控」接口，需要 ERP 登录（超管 / 财务 / 客服角色）。
// 原来用的匿名接口 GET /api/backups?id= 会被删掉：备份是整库数据，不能谁都能拿到。
import {baseUrl} from "./cloud-v2-api";

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
    try {
        const body = await res.json()
        return body?.message || body?.error || fallback
    } catch {
        return fallback
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
