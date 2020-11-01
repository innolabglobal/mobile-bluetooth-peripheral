import { DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { Platform } from '@ionic/angular';
import { BluetoothLE } from '@ionic-native/bluetooth-le/ngx';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  title = 'INFORMATION SCREEN';
  username = '';
  email = '';
  device = '';
  date;
  time;
  pipe = new DatePipe('en-US');
  image = '/assets/img/bg_mobile.jpg';
  imgAB = [];
  imgABCount;
  objAB = [];
  objABCount;

  constructor(public bluetoothle: BluetoothLE,
              public cdRef: ChangeDetectorRef,
              public plt: Platform) {
    console.log('***** constructor', this.bluetoothle);
  }

  ionViewWillEnter() {
    console.log('***** ionViewWillEnter');

    this.plt.ready().then((readySource) => {

      console.log('***** Platform ready from', readySource);

      this.bluetoothle
        .initialize()
        .subscribe(
          res => console.log('***** bluetoothle.initialize success', res),
          err => console.log('***** bluetoothle.initialize error', err)
        );

      const peripheralParams = {
        request: true,
        // restoreKey: 'bluetoothleplugin'
      };

      this.bluetoothle
        .initializePeripheral(peripheralParams)
        .subscribe(
          res => this.handleInitializePeripheralSuccess(res),
          err => console.log('***** bluetoothle.initializePeripheral error', err)
        );
    });
  }

  private handleInputDetails(successRes, value) {
    const resObj = JSON.parse(value);
    console.log('***** resObj ===> ', resObj, resObj.name, resObj.email);
    this.username = resObj.name;
    this.email = resObj.email;
    this.device = successRes.address;
    this.image = resObj.image;
    console.log('***** this ===> ', this.username, this.email);
    this.date = this.pipe.transform(new Date(), 'shortDate');
    this.time = this.pipe.transform(new Date(), 'shortTime');
    this.objABCount = undefined;
    this.objAB = [];
  }

  private handleInputImage(successRes, value) {
    console.log('***** handleInputImage ===>', `/${this.imgABCount}/`, value);

    if (this.imgABCount === undefined) {
      console.log('***** handleInputImage undefined ===>', `/${this.imgABCount}/`, parseInt(value, 10) + 1);
      this.imgABCount = parseInt(value, 10) + 1;
    } else if (parseInt(value, 10) === this.imgABCount) {
      console.log('***** handleInputImage SHOULD HAVE DONE ===>', `/${this.imgABCount}/`, this.imgAB);
      this.image = this.imgAB.join('').replace(/"/g, '');
      console.log('***** handleInputImage SHOULD HAVE DONE IMAGE ===>', `/${this.imgABCount}/`, this.image);
      this.cdRef.detectChanges();
    } else if (this.imgAB.length < this.imgABCount) {
      console.log('***** handleInputImage not equal ===>', `/${this.imgABCount}/`, this.imgAB);
      this.imgAB.push(value);
    } else {
      console.log('***** handleInputImage DONE ===>', `/${this.imgABCount}/`, this.imgAB);
    }
  }

  private handleInputObject(successRes, value) {
    console.log('***** handleInputObject ===>', `/${this.objABCount}/`, value);

    if (this.objABCount === undefined) {
      console.log('***** handleInputObject undefined ===>', `/${this.objABCount}/`, parseInt(value, 10) + 1);
      this.objABCount = parseInt(value, 10) + 1;
    } else if (parseInt(value, 10) === this.objABCount) {
      console.log('***** handleInputObject SHOULD HAVE DONE ===>', `/${this.objABCount}/`, this.objAB);
      const fullStr = this.objAB.join('');
      this.handleInputDetails(successRes, fullStr);
      console.log('***** handleInputObject SHOULD HAVE DONE IMAGE ===>', `/${this.objABCount}/`, fullStr);
      this.cdRef.detectChanges();
    } else if (this.objAB.length < this.objABCount) {
      console.log('***** handleInputObject not equal ===>', `/${this.objABCount}/`, this.objAB);
      this.objAB.push(value);
    } else {
      console.log('***** handleInputObject DONE ===>', `/${this.objABCount}/`, this.objAB);
    }
  }

  private handleInitializePeripheralSuccess(successRes: any) {
    console.log('***** bluetoothle.initializePeripheral success', successRes);

    if (successRes.status === 'subscribed') {
      this.bluetoothle.connect({ address: successRes.address, autoConnect: true })
        .subscribe(res => console.log(res), err => console.log(err));
    }

    if (successRes.status === 'writeRequested') {
      const returnedValue = successRes.value;
      console.log('***** writeRequested', successRes, returnedValue);
      const byte = this.bluetoothle.encodedStringToBytes(returnedValue);
      console.log('***** Byte ===> ', byte);
      const value = this.bluetoothle.bytesToString(byte);
      console.log('***** Value ===> ', value);
      const ab = this.byte2ab(byte);
      console.log('***** Array Buffer ===> ', ab);
      const str = this.ab2str(ab);
      console.log('***** String ===> ', str);

      this.bluetoothle.isConnected({ address: successRes.address })
        .then(res => console.log(res))
        .catch(err => console.log(err));

      this.bluetoothle.isBonded({ address: successRes.address })
        .then(res => console.log(res))
        .catch(err => console.log(err));

      const respondParams = {
        requestId: successRes.requestId,
        value: successRes.value,
      };

      this.bluetoothle.respond(respondParams)
        .then(res => console.log(res))
        .catch(err => console.log(err));

      switch (successRes.characteristic) {
        case '2234':
          // this.handleInputNameAndEmail(successRes, value);
          break;
        case '3234':
          this.handleInputImage(successRes, value);
          break;
        case '4234':
          this.handleInputObject(successRes, value);
          break;
      }

      this.cdRef.detectChanges();

      return;
    }

    if (successRes.status === 'enabled') {

      const params = {
        service: '0x1234',
        characteristics: [
          {
            uuid: '0x2234',
            permissions: {
              read: true,
              write: true,
              // readEncryptionRequired: true,
              // writeEncryptionRequired: true,
            },
            properties: {
              read: true,
              writeWithoutResponse: true,
              write: true,
              notify: true,
              indicate: true,
              // authenticatedSignedWrites: true,
              // notifyEncryptionRequired: true,
              // indicateEncryptionRequired: true,
            }
          },
          {
            uuid: '0x3234',
            permissions: {
              read: true,
              write: true,
              // readEncryptionRequired: true,
              // writeEncryptionRequired: true,
            },
            properties: {
              read: true,
              writeWithoutResponse: true,
              write: true,
              notify: true,
              indicate: true,
              // authenticatedSignedWrites: true,
              // notifyEncryptionRequired: true,
              // indicateEncryptionRequired: true,
            }
          },
          {
            uuid: '0x4234',
            permissions: {
              read: true,
              write: true,
              // readEncryptionRequired: true,
              // writeEncryptionRequired: true,
            },
            properties: {
              read: true,
              writeWithoutResponse: true,
              write: true,
              notify: true,
              indicate: true,
              // authenticatedSignedWrites: true,
              // notifyEncryptionRequired: true,
              // indicateEncryptionRequired: true,
            }
          }
        ]
      };

      this.bluetoothle.addService(params).then(
        res => this.handleAddServiceSuccess(res),
        err => console.log('***** bluetoothle.addService error', err)
      );
    }
  }

  private handleAddServiceSuccess(successRes) {
    console.log('***** bluetoothle.addService success', successRes);

    const params = {
      services: ['1234'], // iOS
      service: '1234', // Android
      name: 'Hello World',
    };
    this.bluetoothle.startAdvertising(params).then(
      res => this.handleStartAdvertisingSuccess(res),
      err => console.log('***** bluetoothle.startAdvertising error', err)
    );
  }

  private handleStartAdvertisingSuccess(successRes) {
    console.log('***** bluetoothle.startAdvertising success', successRes);

    this.imgABCount = undefined;
    this.imgAB = [];

    this.objABCount = undefined;
    this.objAB = [];
  }

  ab2str(buf) {
    return String.fromCharCode.apply(null, new Uint16Array(buf));
  }

  str2ab(str) {
    const buf = new ArrayBuffer(str.length * 2); // 2 bytes for each char
    const bufView = new Uint16Array(buf);
    for (let i = 0, strLen = str.length; i < strLen; i++) {
      bufView[i] = str.charCodeAt(i);
    }
    return buf;
  }

  byte2ab(byteArray) {
    const uint16Array = new Uint16Array(byteArray.length);
    for (let i = 0; i < uint16Array.length; i++) {
      uint16Array[i] = byteArray[i];
    }

    return uint16Array;
  }
}
