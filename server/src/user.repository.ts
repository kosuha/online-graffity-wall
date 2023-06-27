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
            }
        }
    }

    getUsers(): UserData[] {
        return this.users;
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