import { IonContent, IonIcon, IonLoading, IonPage, useIonRouter, useIonToast } from '@ionic/react';
import { useEffect, useState } from 'react';
import { useAppSelector } from '../../hooks/loginHooks';
import moment from 'moment';
import httpClient from '../../hooks/CapacitorClient';
import { arrowBack, downloadOutline } from 'ionicons/icons';
import qrCodeImage from '../../assets/images/QR_code.png';
import '../../assets/QRView.css';

const QRView: React.FC = () => {
  const router = useIonRouter();
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
    if (!image || image === qrCodeImage) {
      showToast("No hay QR disponible para descargar", "warning");
      return;
    }

    try {
      // Convert base64 to blob
      const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/png' });
      const url = URL.createObjectURL(blob);

      // Create a temporary link and download
      const link = document.createElement('a');
      link.href = url;
      link.download = `qr-personal-${username || user || 'usuario'}-${moment().format('YYYYMMDD-HHmm')}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast("QR descargado correctamente", "success");
    } catch (error) {
      console.error('[QRView] Error downloading QR:', error);
      showToast("Error al descargar QR", "danger");
    }
  };

  const getQRImage = async () => {
    try {
      setLoading(true);
      const currentTime = moment().format("DD/MM/YYYY, HH:mm");
      const endTime = moment().add(5, 'minutes').format("DD/MM/YYYY, HH:mm");
      setTime(currentTime);
      setTimeEnd(endTime);
      
      console.log('[QRView] Fetching QR for user:', user);
      
      const response = await httpClient.post('/mobile/obtainQR', { 
        user, 
        fechaInicio: moment().format("YYYY-MM-DD HH:mm:ss"), 
        fechaFin: moment().add(5, 'minutes').format("YYYY-MM-DD HH:mm:ss") 
      });
      
      console.log('[QRView] Response status:', response.status);
      
      if (response.status === 403) {
        console.log('[QRView] 403 Forbidden');
        return false;
      }
      
      if (response.data?.qrCode) {
        console.log('[QRView] QR code received successfully');
        setImage(response.data.qrCode);
      } else {
        console.log('[QRView] No qrCode in response:', response.data);
      }
    } catch (error) {
      console.error('[QRView] Error fetching QR:', error);
      // Keep using default QR image if API fails
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch QR immediately on mount
    console.log('[QRView] Component mounted, fetching QR...');
    getQRImage();
    
    // Set up auto-refresh every 5 minutes
    const intervalId = setInterval(() => {
      console.log('[QRView] Auto-refreshing QR...');
      getQRImage();
    }, 5 * 60 * 1000);

    return () => {
      console.log('[QRView] Cleaning up interval');
      clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

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
