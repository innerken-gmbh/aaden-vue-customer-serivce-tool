// Import the functions you need from the SDKs you need
import {initializeApp} from 'firebase/app'
import {getAnalytics} from 'firebase/analytics'
import {
    createUserWithEmailAndPassword,
    getAuth,
    signInWithEmailAndPassword
} from 'firebase/auth'
import {DocumentData, getDoc, getDocs, getFirestore, Query, QuerySnapshot,collection,query,setDoc,doc} from 'firebase/firestore'
import hillo from "hillo";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: 'AIzaSyCtvQ3d-HAtHTUg_-505c-qXRnlz8RlZeg',
    authDomain: 'aaden-saas.firebaseapp.com',
    projectId: 'aaden-saas',
    storageBucket: 'aaden-saas.appspot.com',
    messagingSenderId: '169167876904',
    appId: '1:169167876904:web:b73fffef6818a7b7cc161d',
    measurementId: 'G-XW42B6SHKW',
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const analytics = getAnalytics(app)
export const db = getFirestore(app)
export const FireBaseAuth = getAuth(app)

export async function executeQuery(query: Query<DocumentData>) {
    return getDocContentWithId(await getDocs(query))
}

function getDocContentWithId(docs: QuerySnapshot<DocumentData>): any[] {
    return docs.docs.map(docContent)
}

export async function getDocContent(docRef) {
    return docContent(await getDoc(docRef))
}

export function docContent(doc: DocumentData) {
    return {
        id: doc.id,
        ...doc.data(),
    }
}

export function downloadFile(url: string) {
    window.open(url, '_blank')
}

const url = "https://cloud-v2.aaden.io"

export async function getDeviceStatus() {
    return await hillo.get(url + "/deviceLog/list")
}

export async function getDeviceSummaryStatus() {
    return await hillo.get(url + "/ensureTseQr2025/summaryCurrentStatus")
}

export async function getEventListForDeviceId(deviceId) {
    return await hillo.get(url + "/deviceLog/eventList/" + deviceId)
}

export function getNgrokUrl(deviceId: string) {
    return 'ik' + deviceId.toString().padStart(4, '0') + '.ngrok.aaden.io'
}

export function getEndPointUrl(deviceId: string) {
    return 'https://' + getNgrokUrl(deviceId) + '/PHP/'
}

export async function getAllSubscriptionForStore (deviceId) {
    return await resultOf(query(collection(db, 'saas-store-subscription', deviceId.toString(), 'subscriptions')))
}

export async function resultOf (query, logLabel = '') {
    const res = (await getDocs(query)).docs
        .map(docContent)
    if (logLabel) {
        console.log(res, logLabel)
    }
    return res
}

export async function setRules (rules) {
    return await setDoc(doc(db, 'simplifyRules','aaden'),{rules})
}

export async function getRules () {
    return (await resultOf(query(collection(db, 'simplifyRules')))).find(it => it.id === 'aaden').rules
}
export async function getKey () {
    return (await resultOf(query(collection(db, 'openAIKey')))).find(it => it.id === 'aaden').key
}

export async function createUserWithEmail (email, password) {
    return await createUserWithEmailAndPassword(FireBaseAuth, email, password)
}

export async function loginWithEmailAndPassword (email, password) {
    return await signInWithEmailAndPassword(FireBaseAuth, email, password)
}

export function getCurrentUserId () {
    return FireBaseAuth.currentUser?.uid
}
