import { Injectable } from '@nestjs/common';
import { UserData } from './dataTransferObjects/UserData.dto';

@Injectable()
export class UserRepository {
    users: UserData[] = [];

    pushUser(data: UserData): void {
        this.users.push(data);
    }

    popUser(data: UserData): void {
        for (let i = 0; i < this.users.length; i++) {
            if (data.id === this.users[i].id) {
                this.users.splice(i, 1);
                return ;
            }
        }
    }

    isInUsers(data: UserData): boolean {
        for (let i = 0; i < this.users.length; i++) {
            if (data.id === this.users[i].id) {
                return true;
            }
        }
        return false;
    }

    getUsers(): UserData[] {
        return this.users;
    }

    updateUser(userData: UserData): void {
        for (let i = 0; i < this.users.length; i++) {
            if (userData.id === this.users[i].id) {
                this.users[i] = userData;
                return ;
            }
        }
    }

    getUserById(id: string): UserData {
        for (let i = 0; i < this.users.length; i++) {
            if (id === this.users[i].id) {
                return this.users[i];
            }
        }
        return undefined;
    }
}