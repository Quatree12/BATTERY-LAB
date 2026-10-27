
import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
  Legend
} from 'chart.js';
import {
  Activity, BatteryCharging, BatteryFull, Plus, Trash2,
  RotateCcw, Download, Zap, Smartphone, Headphones,
  LayoutDashboard, ChartNoAxesCombined
} from 'lucide-react';
import './styles.css';

ChartJS.register(
  CategoryScale, LinearScale, PointElement,
  LineElement, Tooltip, Filler, Legend
);

const initialDevices = [
  { id: 'iphone', name: 'iPhone XR', type: 'phone', battery: 78, history: [] },
  { id: 'headphones', name: 'Sony Headphones', type: 'audio', battery: 64, history: [] }
];

function readSaved() {
  try {
    const saved = localStorage.getItem('battery-lab-devices');
    return saved ? JSON.parse(saved) : initialDevices;
  } catch {
    return initialDevices;
  }
}

function App() {
  const [devices, setDevices] = useState(readSaved);
  const [selected, setSelected] = useState('iphone');
  const [view, setView] = useState('dashboard');
  const [newName, setNewName] = useState('');
  const [newBattery, setNewBattery] = useState('80');
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    localStorage.setItem('battery-lab-devices', JSON.stringify(devices));
  }, [devices]);

  const current = devices.find(d => d.id === selected) || devices[0];

  const updateDevices = (id, updater) => {
    setDevices(previous => previous.map(d => d.id === id ? updater(d) : d));
  };

  const recordBattery = (device) => {
    const value = Number(newBattery);
    if (!Number.isFinite(value) || value < 0 || value > 100) return;

    updateDevices(device.id, d => ({
      ...d,
      battery: value,
      history: [
        ...d.history,
        { battery: value, time: new Date().toISOString() }
      ]
    }));
  };

  const resetCycle = device => updateDevices(device.id, d => ({
    ...d,
    history: [...d.history, {
      battery: d.battery,
      time: new Date().toISOString(),
      event: 'Recharge'
    }]
  }));

  const addDevice = event => {
    event.preventDefault();
    if (!newName.trim()) return;

    const id = `${Date.now()}`;
    const battery = Math.max(0, Math.min(100, Number(newBattery) || 0));
    const device = {
      id,
      name: newName.trim(),
      type: 'other',
      battery,
      history: [{ battery, time: new Date().toISOString() }]
    };

    setDevices(previous => [...previous, device]);
    setSelected(id);
    setNewName('');
    setShowAdd(false);
    setView('devices');
  };

  const chartHistory = useMemo(() => {
    const history = current?.history || [];
    return history.slice(-12);
  }, [current]);

  const chartData = {
    labels: chartHistory.map(item =>
      new Date(item.time).toLocaleTimeString('fr-CH', {
        hour: '2-digit',
        minute: '2-digit'
      })
    ),
    datasets: [{
      label: 'Batterie',
      data: chartHistory.map(item => item.battery),
      borderColor: '#7cf7e2',
      backgroundColor: 'rgba(124,247,226,0.12)',
      fill: true,
      tension: 0.38,
      pointRadius: 4,
      pointBackgroundColor: '#7cf7e2'
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: context => `${context.parsed.y}%`
        }
      }
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: { color: '#8793b2', callback: value => `${value}%` },
        grid: { color: 'rgba(150,170,220,0.1)' }
      },
      x: {
        ticks: { color: '#8793b2' },
        grid: { display: false }
      }
    }
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify(devices, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'battery-lab-data.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const iconFor = device => device.type === 'phone'
    ? <Smartphone size={20} />
    : device.type === 'audio'
      ? <Headphones size={20} />
      : <BatteryFull size={20} />;

  const totalReadings = devices.reduce((sum, d) => sum + d.history.length, 0);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Zap size={23} /></div>
          <div>
            <strong>BATTERY LAB</strong>
            <span>BATTERY INTELLIGENCE</span>
          </div>
        </div>

        <p className="nav-label">WORKSPACE</p>
        <button className={view === 'dashboard' ? 'nav-item active' : 'nav-item'}
          onClick={() => setView('dashboard')}>
          <LayoutDashboard size={18} /> Dashboard
        </button>
        <button className={view === 'devices' ? 'nav-item active' : 'nav-item'}
          onClick={() => setView('devices')}>
          <BatteryFull size={18} /> Mes appareils
        </button>
        <button className={view === 'analytics' ? 'nav-item active' : 'nav-item'}
          onClick={() => setView('analytics')}>
          <ChartNoAxesCombined size={18} /> Analyses
        </button>

        <div className="sidebar-bottom">
          <span className="status-dot"></span>
          <span>LOCAL STORAGE</span>
          <small>Données sur cet appareil</small>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <span className="eyebrow">PERSONAL ENERGY MONITOR</span>
            <h1>{view === 'dashboard' ? 'Vue d’ensemble' :
              view === 'devices' ? 'Mes appareils' : 'Analyses & historique'}</h1>
          </div>
          <button className="icon-button" onClick={exportData} title="Exporter les données">
            <Download size={19} />
          </button>
        </header>

        {view === 'dashboard' && (
          <>
            <section className="hero-card">
              <div className="hero-copy">
                <span className="pill"><Activity size={13} /> LIVE TRACKING MANUEL</span>
                <h2>Chaque pourcentage<br />raconte une histoire.</h2>
                <p>Observe l’évolution de tes batteries, note tes niveaux et explore tes cycles de recharge.</p>
                <button className="primary-button" onClick={() => {
                  setView('devices');
                  setShowAdd(true);
                }}>
                  <Plus size={17} /> Ajouter un appareil
                </button>
              </div>
              <div className="orb-wrap">
                <div className="orb-ring"></div>
                <div className="orb">
                  <BatteryCharging size={42} />
                  <strong>{current?.battery ?? 0}%</strong>
                  <span>{current?.name || 'Appareil sélectionné'}</span>
                </div>
              </div>
              <div className="hero-decoration">ENERGY / 001</div>
            </section>

            <section className="stats-grid">
              <article className="stat-card">
                <span className="stat-icon mint"><BatteryFull size={20} /></span>
                <p>Appareils suivis</p>
                <strong>{devices.length}</strong>
                <small>Dans ton espace personnel</small>
              </article>
              <article className="stat-card">
                <span className="stat-icon violet"><Activity size={20} /></span>
                <p>Relevés enregistrés</p>
                <strong>{totalReadings}</strong>
                <small>Historique manuel</small>
              </article>
              <article className="stat-card">
                <span className="stat-icon blue"><Zap size={20} /></span>
                <p>Appareil sélectionné</p>
                <strong>{current?.battery ?? 0}%</strong>
                <small>Niveau déclaré actuellement</small>
              </article>
            </section>

            <section className="panel">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">BATTERY TELEMETRY</span>
                  <h3>Courbe de batterie</h3>
                </div>
                <select value={selected} onChange={e => setSelected(e.target.value)}>
                  {devices.map(device =>
                    <option value={device.id} key={device.id}>{device.name}</option>
                  )}
                </select>
              </div>
              {chartHistory.length > 0 ? (
                <div className="chart-wrap">
                  <Line data={chartData} options={chartOptions} />
                </div>
              ) : (
                <div className="empty-chart">
                  <ChartNoAxesCombined size={30} />
                  <strong>Pas encore de courbe</strong>
                  <span>Enregistre plusieurs relevés pour visualiser l’évolution.</span>
                </div>
              )}
            </section>
          </>
        )}

        {view === 'devices' && (
          <>
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">YOUR HARDWARE</span>
                  <h3>Inventaire des appareils</h3>
                </div>
                <button className="primary-button" onClick={() => setShowAdd(!showAdd)}>
                  <Plus size={16} /> Nouvel appareil
                </button>
              </div>

              {showAdd && (
                <form className="add-form" onSubmit={addDevice}>
                  <label>Nom de l’appareil
                    <input value={newName} onChange={e => setNewName(e.target.value)}
                      placeholder="Ex. Écouteurs Sony" required />
                  </label>
                  <label>Batterie actuelle (%)
                    <input type="number" min="0" max="100" value={newBattery}
                      onChange={e => setNewBattery(e.target.value)} required />
                  </label>
                  <button className="primary-button" type="submit">Créer l’appareil</button>
                </form>
              )}

              <div className="device-list">
                {devices.map(device => (
                  <article className={selected === device.id ? 'device-row chosen' : 'device-row'}
                    key={device.id}>
                    <button className="device-select" onClick={() => setSelected(device.id)}>
                      <span className="device-icon">{iconFor(device)}</span>
                      <span className="device-info">
                        <strong>{device.name}</strong>
                        <small>{device.history.length} relevé(s) enregistré(s)</small>
                      </span>
                    </button>
                    <div className="device-level">
                      <strong>{device.battery}%</strong>
                      <div className="mini-bar"><span style={{ width: `${device.battery}%` }} /></div>
                    </div>
                    <button className="small-action" onClick={() => {
                      setSelected(device.id);
                      setNewBattery(String(device.battery));
                      document.getElementById('record-battery')?.focus();
                    }}>Relever</button>
                    <button className="danger-icon" aria-label="Supprimer l’appareil"
                      onClick={() => {
                        if (devices.length <= 1) {
                          alert('Garde au moins un appareil dans BATTERY LAB.');
                          return;
                        }
                        const remaining = devices.filter(d => d.id !== device.id);
                        setDevices(remaining);
                        if (selected === device.id) setSelected(remaining[0].id);
                      }}>
                      <Trash2 size={16} />
                    </button>
                  </article>
                ))}
              </div>
            </section>

            <section className="panel">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">MANUAL INPUT</span>
                  <h3>Enregistrer un relevé</h3>
                </div>
                <span className="pill">0–100%</span>
              </div>
              <p className="muted">Sélection : {current?.name}</p>
              <form className="reading-form" onSubmit={e => {
                e.preventDefault();
                recordBattery(current);
              }}>
                <label>Niveau de batterie (%)
                  <input id="record-battery" type="number" min="0" max="100"
                    value={newBattery} onChange={e => setNewBattery(e.target.value)} required />
                </label>
                <button className="primary-button" type="submit">
                  <Plus size={16} /> Enregistrer le relevé
                </button>
                <button className="secondary-button" type="button"
                  onClick={() => resetCycle(current)}>
                  <RotateCcw size={16} /> Marquer une recharge
                </button>
              </form>
            </section>
          </>
        )}

        {view === 'analytics' && (
          <>
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">DATA EXPLORER</span>
                  <h3>Historique des relevés</h3>
                </div>
                <select value={selected} onChange={e => setSelected(e.target.value)}>
                  {devices.map(device =>
                    <option value={device.id} key={device.id}>{device.name}</option>
                  )}
                </select>
              </div>
              {current?.history.length ? (
                <div className="history-list">
                  {[...current.history].reverse().map((item, index) => (
                    <div className="history-row" key={`${item.time}-${index}`}>
                      <span className="history-dot"></span>
                      <div>
                        <strong>{item.event || 'Relevé de batterie'}</strong>
                        <small>{new Date(item.time).toLocaleString('fr-CH')}</small>
                      </div>
                      <strong>{item.battery}%</strong>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-chart">
                  <Activity size={30} />
                  <strong>Aucune donnée pour le moment</strong>
                  <span>Ajoute des relevés depuis la page Mes appareils.</span>
                </div>
              )}
            </section>
            <section className="panel note-panel">
              <Zap size={20} />
              <div>
                <strong>À savoir</strong>
                <p>Les variations et les tendances se construisent à partir de tes relevés. BATTERY LAB ne lit pas automatiquement les données système de l’iPhone ni le niveau Bluetooth des écouteurs.</p>
              </div>
            </section>
          </>
        )}

        <footer>
          <span>BATTERY LAB <b>•</b> PERSONAL EDITION</span>
          <span>MESURES MANUELLES · DONNÉES LOCALES</span>
        </footer>
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode><App /></React.StrictMode>
);
