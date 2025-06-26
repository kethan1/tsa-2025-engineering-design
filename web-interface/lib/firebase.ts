import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: process.env.apiKey || "",
  authDomain: process.env.authDomain || "",
  databaseURL: process.env.databaseURL || "",
  projectId: process.env.projectId || "",
  storageBucket: process.env.storageBucket || "",
  messagingSenderId: process.env.messagingSenderId || "",
  appId: process.env.appId || "",
  measurementId: process.env.measurementId || "",
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { app, database };
