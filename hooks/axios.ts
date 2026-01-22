import axios from 'axios';

const client = axios.create({
  // baseURL: 'http://localhost:3000',// DEV
  // baseURL: 'http://localhost:3000',// QA
  // baseURL: 'http://localhost:3000',// PRD
})

export default client;