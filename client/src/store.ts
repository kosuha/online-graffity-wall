import { writable } from 'svelte/store';
import { io } from 'socket.io-client';

// const socket = io('http://localhost:3000');
const socket = io('http://3.35.234.234:3000');

export const socketStore = writable(socket);