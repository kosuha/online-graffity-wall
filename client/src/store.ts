import { writable } from 'svelte/store';
import { io } from 'socket.io-client';

const socket = io('http://ec2-100-26-112-62.compute-1.amazonaws.com/');

export const socketStore = writable(socket);