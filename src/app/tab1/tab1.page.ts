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
        img: '',
        action: '0869145377',
        type: 'mobile',
        icon: 'assets/icon/phone.png',
      },
      {
        id: 2,
        title: 'Facebook',
        img: '',
        action: 'https://www.facebook.com/LongLwu2000',
        type: 'url',
        icon: 'assets/icon/fb.png',
      },
      {
        id: 3,
        title: 'Messenger',
        img: '',
        action: 'http://m.me/LongLwu2000',
        type: 'url',
        icon: 'assets/icon/mess.png',
      },
      {
        id: 4,
        title: 'Instagram',
        img: '',
        action: 'https://www.instagram.com/_lluu_llong.508/',
        type: 'url',
        icon: 'assets/icon/insta.png',
      },
      {
        id: 5,
        title: 'Zalo',
        img: '',
        action: 'https://zalo.me/0869145377',
        type: 'url',
        icon: 'assets/icon/zalo.png',
      },
      {
        id: 6,
        title: 'Tiktok',
        img: '',
        action: 'https://www.tiktok.com/@lwu.long',
        type: 'url',
        icon: 'assets/icon/tiktok.png',
      },
      {
        id: 7,
        title: 'Email',
        img: '',
        action: 'luuhoanglong508@gmail.com',
        type: 'email',
        icon: 'assets/icon/gmail.png',
      },
      {
        id: 8,
        title: 'Banking',
        img: '/assets/images/banking.jpg',
        action: 'Lưu Hoàng Long',
        type: 'banking',
        icon: 'assets/icon/credit-card.png',
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
        break;
      case 'banking':
        this.alertLoading.popupImage(button.img,'Banking',button.action);
        break;

    }
  }
}
