import { IonContent, IonIcon, IonLoading, IonPage, useIonRouter, useIonToast } from '@ionic/react';
import { useEffect, useRef, useState } from 'react';
import { useAppSelector } from '../../hooks/loginHooks';
import moment from 'moment';
import httpClient from '../../hooks/CapacitorClient';
import { arrowBack, downloadOutline } from 'ionicons/icons';
import qrCodeImage from '../../assets/images/QR_code.png';
import '../../assets/QRView.css';

const QRView: React.FC = () => {
  const router = useIonRouter();
  const effectRan = useRef(false);
  const { user, username } = useAppSelector((state) => state.login);
  const [time, setTime] = useState(moment().format("DD/MM/YYYY, HH:mm"));
  const [timeEnd, setTimeEnd] = useState(moment().add(5, 'minutes').format("DD/MM/YYYY, HH:mm"));
  const [image, setImage] = useState<string>(qrCodeImage);
  const [loading, setLoading] = useState<boolean>(false);
  const [toast] = useIonToast();

  const showToast = (message: string, color: 'warning' | 'danger' | 'success' = "success") => {
    toast({
      message,
      duration: 1500,
      swipeGesture: "vertical",
      position: "top",
      color,
      buttons: [{ text: "✖", role: "cancel" }]
    });
  };

  const handleBack = () => {
    router.push('/home', 'back', 'pop');
  };

  const handleDownloadQR = () => {
    showToast("Descargando QR...", "success");
    // Implement QR download logic
  };

  const getQRImage = async () => {
    try {
      setLoading(true);
      const currentTime = moment().format("DD/MM/YYYY, HH:mm");
      const endTime = moment().add(5, 'minutes').format("DD/MM/YYYY, HH:mm");
      setTime(currentTime);
      setTimeEnd(endTime);
      
      const response = await httpClient.post('/mobile/obtainQR', { 
        user, 
        fechaInicio: moment().format("YYYY-MM-DD HH:mm:ss"), 
        fechaFin: moment().add(5, 'minutes').format("YYYY-MM-DD HH:mm:ss") 
      });
      
      if (response.status === 403) return false;
      if (response.data.qrCode) {
        setImage(response.data.qrCode);
      }
    } catch {
      // Keep using default QR image if API fails
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <IonPage>
      <IonContent fullscreen className="qrview-content">
        <IonLoading spinner="circles" isOpen={loading} onDidDismiss={() => setLoading(false)} />
        
        <div className="qrview-container">
          {/* Header with back button */}
          <div className="qrview-header">
            <button className="qrview-back-button" onClick={handleBack}>
              <IonIcon icon={arrowBack} />
              <span>Volver al Inicio</span>
            </button>
          </div>

          {/* Content */}
          <div className="qrview-content-area">
            {/* Title */}
            <h1 className="qrview-title">QR</h1>
            <p className="qrview-subtitle">Ingresa con este QR</p>

            {/* QR Section */}
            <div className="qrview-section">
              {/* QR Code */}
              <div className="qrview-qr-container">
                <img src={image} alt="QR Code" />
              </div>

              {/* User Name */}
              <h2 className="qrview-user-name">{username || 'Sebastián Briones'}</h2>

              {/* Date Info */}
              <div className="qrview-date-info">
                <p className="qrview-date-text">Válido desde: {time} hs.</p>
                <p className="qrview-date-text">Hasta: {timeEnd} hs.</p>
              </div>

              {/* Download QR Link */}
              <button className="qrview-download-link" onClick={handleDownloadQR}>
                <IonIcon icon={downloadOutline} />
                <span>Descargar QR</span>
              </button>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default QRView;
