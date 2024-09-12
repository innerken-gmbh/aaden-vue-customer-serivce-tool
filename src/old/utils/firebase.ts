// Import the functions you need from the SDKs you need
import {initializeApp} from 'firebase/app'
import {getAnalytics} from 'firebase/analytics'
import {DocumentData, getDoc, getDocs, getFirestore, Query, QuerySnapshot,} from 'firebase/firestore'
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
const db = getFirestore(app)

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

export async function getEventListForDeviceId(deviceId) {
    return await hillo.get(url + "/deviceLog/eventList/" + deviceId)
}

export function getNgrokUrl(deviceId: string) {
    return 'ik' + deviceId.padStart(4, '0') + '.ngrok.aaden.io'
}

export function getEndPointUrl(deviceId: string) {
    return 'https://' + getNgrokUrl(deviceId) + '/PHP/'
}
