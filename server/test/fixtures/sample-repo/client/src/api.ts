import axios from 'axios';
export const getUsers = () => axios.get('/api/users');
export const api = { get: (u: string) => fetch(u) };
