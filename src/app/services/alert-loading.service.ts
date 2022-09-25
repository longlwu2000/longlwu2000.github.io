import {
  AlertController,
  LoadingController,
  ToastController,
} from '@ionic/angular';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AlertLoadingService {
  constructor(
    private alertController: AlertController,
    private loadingCtrl: LoadingController,
    private toastController: ToastController
  ) {}
  handlerMessage = '';
  roleMessage = '';
  async presentAlert(
    header,
    message: string = 'Warring!',
    buttons = [
      {
        text: 'OK',
        role: 'confirm',
        handler: () => {
          this.handlerMessage = 'Alert confirmed';
        },
      },
    ],
    subHeader?,
  ) {
    const alert = await this.alertController.create({
      header,
      subHeader,
      message,
      buttons,
    });

    await alert.present();
    const { role } = await alert.onDidDismiss();
    this.roleMessage = `Dismissed with role: ${role}`;
    console.log(this.roleMessage);
  }

  async showLoading(
    message,
    duration = 5000,
    spinner:
      | 'bubbles'
      | 'circles'
      | 'circular'
      | 'crescent'
      | 'dots'
      | 'lines'
      | 'lines-sharp'
      | 'lines-sharp-small'
      | 'lines-small'
      | null
      | undefined = 'circles'
  ) {
    const loading = await this.loadingCtrl.create({
      message,
      duration,
      spinner,
    });

    loading.present();
    return loading;
  }
  hideLoading(loading) {
    loading.dismiss();
  }

  async presentToast(
    message,
    duration = 5000,
    position: 'bottom' | 'top' | 'middle' = 'bottom'
  ) {
    const toast = await this.toastController.create({
      message,
      duration,
      position,
      buttons: [
        {
          text: 'Dismiss',
          role: 'cancel',
          handler: () => {
            this.handlerMessage = 'Dismiss clicked';
          },
        },
      ],
    });

    await toast.present();
    const { role } = await toast.onDidDismiss();
    this.roleMessage = `Dismissed with role: ${role}`;
    console.log(this.roleMessage);
  }
}
