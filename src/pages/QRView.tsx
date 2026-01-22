import { IonContent, IonImg, IonItem, IonLabel, IonList, IonLoading, IonPage, /* useIonRouter, useIonToast */ } from '@ionic/react';
import '../../assets/Login.css';
import { useEffect, useRef, useState } from 'react';
import { useAppSelector } from '../../hooks/loginHooks';
import moment from 'moment';
import ButtonNav from '../components/ButtonNav';
import httpClient from '../../hooks/CapacitorClient';

const QRView: React.FC = () => {
  const effectRan = useRef(false);
  const { user, username } = useAppSelector((state) => state.login)
  const [time, setTime] = useState(moment().format("DD-MM-YYYY HH:mm:ss"));
  const [timeEnd, setTimeEnd] = useState(moment().add(5, 'minutes').format("DD-MM-YYYY HH:mm:ss"));
  const [image, setImage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const getQRImage = async () => {
    try {
      setLoading(true)
      setTime(moment().format("DD-MM-YYYY HH:mm:ss"));
      const response = await httpClient.post('/mobile/obtainQR', { user, fechaInicio: time, fechaFin: timeEnd });
      if (response.status === 403) return false;

      setImage(response.data.qrCode);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (effectRan.current === true || process.env.NODE_ENV !== 'development') {
      getQRImage();
      const intervalId = setInterval(() => {
        getQRImage();
      }, 5 * 60 * 1000);

      return () => clearInterval(intervalId);
    }

    return () => {
      effectRan.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setTimeEnd(moment().add(5, 'minutes').format("DD-MM-YYYY HH:mm:ss"));
  }, [time])

  return (
    <IonPage>
      <IonContent fullscreen>
        <IonLoading spinner="circles" isOpen={loading} onDidDismiss={() => setLoading(false)} />
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <IonItem style={{ width: '90%', maxWidth: '500px' }}>
            <IonList style={{ margin: "auto", minWidth: "20rem" }}>
              <IonImg src={image}
                alt={"QR"}>
              </IonImg>
              <IonItem>
                <IonLabel>Nombre: {username}</IonLabel>
              </IonItem>
              <IonItem>
                <IonLabel>Hora Desde: {time}</IonLabel>
              </IonItem>
              <IonItem>
                <IonLabel>Hora Hasta: {timeEnd}</IonLabel>
              </IonItem>
            </IonList>
          </IonItem>
        </div>
        <ButtonNav />
      </IonContent>
    </IonPage >
  );
};

export default QRView;
