import { AlertLoadingService } from './../services/alert-loading.service';
import { ButtonUser } from './../../model/btn';
import { User } from './../../model/user';
import { Component } from '@angular/core';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
})
export class Tab1Page {
  current_user: User = new User();
  logo = 'assets/icon/logo.png';
  constructor(public alertLoading: AlertLoadingService) {
    this.current_user.avatar = 'assets/images/avatar.jpg';
    this.current_user.wallpaper = 'assets/images/wall.jpg';
    this.current_user.first_name = 'Lưu';
    this.current_user.last_name = 'Hoàng Long';
    this.current_user.mobile = '0869145377';
    this.current_user.email = 'luuhoanglong508@gmail.com';
    this.current_user.buttons = [
      {
        id: 1,
        title: 'Call Me',
        icon: 'call',
        action: '0869145377',
        type: 'mobile',
        img: 'assets/icon/phone.png',
      },
      {
        id: 2,
        title: 'Facebook',
        icon: 'logo-facebook',
        action: 'https://www.facebook.com/LongLwu2000',
        type: 'url',
        img: 'assets/icon/fb.png',
      },
      {
        id: 3,
        title: 'Messenger',
        icon: 'logo-facebook',
        action: 'http://m.me/LongLwu2000',
        type: 'url',
        img: 'assets/icon/mess.png',
      },
      {
        id: 4,
        title: 'Instagram',
        icon: 'logo-instagram',
        action: 'https://www.instagram.com/_lluu_llong.508/',
        type: 'url',
        img: 'assets/icon/insta.png',
      },
      {
        id: 5,
        title: 'Zalo',
        icon: 'logo-whatsapp',
        action: 'https://zalo.me/0869145377',
        type: 'url',
        img: 'assets/icon/zalo.png',
      },
      {
        id: 6,
        title: 'Tiktok',
        icon: 'logo-tiktok',
        action: 'https://www.tiktok.com/@lwu.long',
        type: 'url',
        img: 'assets/icon/tiktok.png',
      },
      {
        id: 7,
        title: 'Email',
        icon: 'logo-tiktok',
        action: 'luuhoanglong508@gmail.com',
        type: 'email',
        img: 'assets/icon/gmail.png',
      },
    ];
  }
  acction(button: ButtonUser) {
    switch (button.type) {
      case 'url':
        window.open(button.action, '_blank');
        break;
      case 'mobile':
        window.open('tel:' + button.action, '_self');
        break;
      case 'email':
        window.open('mailto:' + button.action, '_self');
    }
  }
}
