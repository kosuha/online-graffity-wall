import { writable } from 'svelte/store';
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');

export const socketStore = writable(socket);