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
  const { user, username, userrol } = useAppSelector((state) => state.login);
  const [time, setTime] = useState(moment().format("DD/MM/YYYY, HH:mm"));
  const [timeEnd, setTimeEnd] = useState(moment().add(5, 'minutes').format("DD/MM/YYYY, HH:mm"));
  const [validityMinutes, setValidityMinutes] = useState<number>(5);
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
    if (!user) return;
    try {
      setLoading(true);
      console.log('[QRView] Fetching personal access QR for user:', user);

      const response = await httpClient.post('/obtainQR', { user });

      if (response.status === 403 || response.status === 400) {
        console.log('[QRView] Request failed:', response.status);
        return;
      }

      const data = response.data;
      if (data?.qrCode) {
        setImage(data.qrCode);
        const start = moment();
        setTime(start.format("DD/MM/YYYY, HH:mm"));
        if (data.validityEnd) {
          const end = moment(data.validityEnd);
          setTimeEnd(end.format("DD/MM/YYYY, HH:mm"));
        } else {
          setTimeEnd(start.clone().add(data.validityMinutes ?? 5, 'minutes').format("DD/MM/YYYY, HH:mm"));
        }
        if (data.validityMinutes != null) setValidityMinutes(data.validityMinutes);
      }
    } catch (error) {
      console.error('[QRView] Error fetching QR:', error);
    } finally {
      setLoading(false);
    }
  };

  // Regenerate QR each time screen is opened; short refresh so token doesn't expire while viewing
  const isAdmin = userrol === '1' || userrol === 'ADM' || userrol === 'SAD';
  const refreshIntervalMs = isAdmin ? 60 * 1000 : 3 * 60 * 1000; // Admin: 1 min, others: 3 min

  useEffect(() => {
    getQRImage();
    const intervalId = setInterval(getQRImage, refreshIntervalMs);
    return () => clearInterval(intervalId);
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
            <p className="qrview-subtitle">Credencial de acceso personal</p>
            <p className="qrview-subtitle-hint">Renovado al abrir esta pantalla · No es una invitación</p>

            {/* QR Section */}
            <div className="qrview-section">
              {/* QR Code */}
              <div className="qrview-qr-container">
                <img src={image} alt="QR Code" />
              </div>

              {/* User Name */}
              <h2 className="qrview-user-name">{username || 'Usuario'}</h2>

              {/* Date Info */}
              <div className="qrview-date-info">
                <p className="qrview-date-text">Válido desde: {time} hs.</p>
                <p className="qrview-date-text">Hasta: {timeEnd} hs. ({validityMinutes} min)</p>
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
