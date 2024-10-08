import { useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode, JwtPayload } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import '../../styles/alerts.style.css';
import '../../styles/meetingScheduler.style.css';
import '../../styles/global.css';

interface CustomJwtPayload extends JwtPayload {
  username?: string;
  email?: string;
}


const MeetingScheduler = () => {
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [serviceType, setServiceType] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [note, setNote] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(true);
  const navigate = useNavigate();


  useEffect(() => {
    const tokenString = localStorage.getItem('jwtToken');
    const token = tokenString ? JSON.parse(tokenString) : null;
    if (!token) {
      setIsAuthorized(false);
      return;
    }

    try {
      const decoded = jwtDecode<CustomJwtPayload>(token);
      setClientName(decoded.username || '');
      setClientEmail(decoded.email || '');
    } catch (error) {
      console.error('Invalid token', error);
    }

    const fetchServiceTypes = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/services`, {
          headers: {
            authorization: `Bearer ${token}`
          }
        });
        setServiceTypes(response.data);
      } catch (error) {
        console.error('Failed to fetch service types', error);
      }
    };

    fetchServiceTypes();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const tokenString = localStorage.getItem('jwtToken');
    const token = tokenString !== null ? JSON.parse(tokenString) : null;
    if (!token) {
      setIsAuthorized(false);
      return;
    }

    const config = {
      headers: {
        authorization: `Bearer ${token}`
      }
    };
    const newMeeting = {
      startTime: time,
      serviceType,
      date,
      note,
      clientName,
      clientEmail
    };

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/meetings`, newMeeting, config);
      if (response.status === 201 || response.status === 200) {
        Swal.fire({
          title: 'הפגישה נקבעה בהצלחה',
          icon: 'success',
          confirmButtonText: 'אישור',
          customClass: {
            popup: 'swal2-popup',
            title: 'swal2-title',
            confirmButton: 'swal2-confirm'
          }
        });
        setServiceType('');
        setDate('');
        setTime('');
        setNote('');
        setClientName('');
        setClientEmail('');
        navigate("/home");
      } else {
        throw new Error('Failed to schedule meeting');
      }
    } catch (error) {
      Swal.fire({
        title: 'שגיאה',
        text: 'נכשל קביעת פגישה',
        icon: 'error',
        confirmButtonText: 'ניסיון שוב',
        customClass: {
          popup: 'swal2-popup',
          title: 'swal2-title',
          confirmButton: 'swal2-confirm'
        }
      });
      console.error(error);
    }
  };

  if (!isAuthorized) {
    return (
      <div>
        <p>אין גישה לעמוד</p>
        <p><a href="/signin">התחבר</a> / <a href="/signup">הרשם</a> בכדי לקבוע פגישה</p>
      </div>
    );
  }

  return (
    <div className="meeting-scheduler">
      <h2>קביעת פגישה</h2>
      <form onSubmit={handleSubmit}>
        <label>
          סוג השירות:
          <select
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value)}
            required
          >
            <option value="">בחר סוג שירות</option>
            {/* {serviceTypes.map((type) => ( */}
            {Array.isArray(serviceTypes) && serviceTypes.map((type) => (
              <option key={type.id} value={type.id}>{type.name}</option>
            ))}
          </select>
        </label>
        <label>
          תאריך:
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </label>
        <label>
          זמן:
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
          />
        </label>
        <label>
          הערה לבעל העסק:
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>
        <label>
          שם לקוח:
          <input
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            required
            readOnly
          />
        </label>
        <label>
          מייל:
          <input className="meeting-email"
            type="text"
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
            required
            readOnly
          />
        </label>
        <button type="submit">קבע פגישה</button>
      </form>
    </div>
  );
};

export default MeetingScheduler;