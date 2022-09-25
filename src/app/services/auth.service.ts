import { AlertLoadingService } from './alert-loading.service';
import { User } from './../../model/user';
import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import {
  AngularFirestore,
  AngularFirestoreCollection,
} from '@angular/fire/compat/firestore';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private usersCollection: AngularFirestoreCollection<User>;
  users: Observable<User[]>;
  user: Observable<any>;
  constructor(
    private fireauth: AngularFireAuth,
    private route: Router,
    private afs: AngularFirestore,
    private alertLoading: AlertLoadingService
  ) {
    this.usersCollection = this.afs.collection<User>('users');
    this.users = this.usersCollection.valueChanges();
    this.user = this.fireauth.authState.pipe(
      switchMap((user) => {
        if (user) {
          return this.afs.doc<User>(`users/${user.uid}`).valueChanges();
        } else {
          return of(null);
        }
      })
    );
  }

  addUser(user: User) {
    this.usersCollection.add(user);
  }
  updateUser(user: User) {
    this.usersCollection.doc(user.id).update(user);
  }

  async login(email: string, password: string) {
    let loading = await this.alertLoading.showLoading('Login...');
    return this.fireauth.signInWithEmailAndPassword(email, password).then(
      (user) => {
        console.log(user);
        this.alertLoading.hideLoading(loading);
        localStorage.setItem('user', JSON.stringify(user));
        this.alertLoading.presentToast('Login success', 2000);
        this.route.navigate(['']);
      },
      (error) => {
        this.alertLoading.hideLoading(loading);
        console.log(error);
      }
    );
  }
  async register(email: string, password: string) {
    let loading = await this.alertLoading.showLoading('Register...');
    return this.fireauth.createUserWithEmailAndPassword(email, password).then(
      (user) => {
        console.log(user);
        this.alertLoading.hideLoading(loading);
        this.alertLoading.presentAlert('Successful','Register success!');
        // login after register
        // this.login(email, password);
        //create user in firestore
        // localStorage.setItem('user', JSON.stringify(user));
        this.route.navigate(['login']);
      },
      (error) => {
        console.log(error);
        this.alertLoading.hideLoading(loading);
      }
    );
  }
  logout() {
    return this.fireauth.signOut().then(
      () => {
        localStorage.removeItem('user');
        this.route.navigate(['/login']);
      },
      (error) => {
        console.log(error);
      }
    );
  }
}
