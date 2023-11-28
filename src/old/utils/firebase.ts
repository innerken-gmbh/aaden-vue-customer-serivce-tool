// Import the functions you need from the SDKs you need
import {initializeApp} from 'firebase/app'
import {getAnalytics} from 'firebase/analytics'
import {collectionGroup, DocumentData, getDoc, getDocs, getFirestore, Query, QuerySnapshot,} from 'firebase/firestore'
import firebase from 'firebase/compat'
import {groupBy, maxBy} from 'lodash-es'
import DocumentReference = firebase.firestore.DocumentReference;
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

export async function getDocContent(docRef: DocumentReference<any>) {
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

export async function getDeviceStatus() {
    const res = await executeQuery(collectionGroup(db, 'echoLog'))
    return Object.entries(groupBy(res.filter(it => {
        return (it?.accessFrom??'').startsWith('aaden-cli')
    }), 'deviceId')).map(([key, v]) => {
        return maxBy(v, 'timestamp')
    })
}

export function getNgrokUrl(deviceId: string) {
    return 'ik' + deviceId.padStart(4, '0') + '.ngrok.aaden.io'
}

export function getEndPointUrl(deviceId: string) {
    return 'https://' + getNgrokUrl(deviceId) + '/PHP/'
}
