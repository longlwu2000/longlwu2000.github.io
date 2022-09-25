import { ButtonUser } from './btn';
export class User
{
    id: string;
    email: string;
    password: string;
    role: number;
    first_name: string;
    last_name: string;
    mobile: string;
    created_date: string;
    last_logon: string;
    status: string;
    avatar: string;
    wallpaper: string;
    buttons: ButtonUser[];
    constructor() {}
}