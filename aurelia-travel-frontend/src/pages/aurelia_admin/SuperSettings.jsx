import { useState, useEffect } from 'react';
import platformService from '../../services/platformService';
import { Save, Shield, Percent, Mail } from 'lucide-react';
import './styles/super-settings.css';

const SuperSettings = () => {
    const [config, setConfig] = useState({ commission_rate: 5.0, support_email: '', maintenance_mode: false });
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const data = await platformService.getSettings();
                setConfig(data);
            } catch (err) { console.error(err); }
        };
        loadSettings();
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await platformService.updateSettings(config);
            setMsg('Settings updated successfully!');
            setTimeout(() => setMsg(''), 3000);
        } catch (err) {
            setMsg('Error saving settings.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="sa-settings-container">
            <h1 className="sa-page-title" style={{marginBottom: '10px'}}>Platform Configuration</h1>
            <p style={{ color: '#64748b', marginBottom: '30px' }}>Manage global system parameters.</p>

            <form onSubmit={handleSave} className="sa-settings-form">
                {/* (Form content remains the same, just ensured handleSave uses service) */}
                
                {/* Commission */}
                <div className="sa-setting-section">
                    <div className="sa-setting-header">
                        <div className="sa-setting-icon sa-icon-finance"><Percent size={20}/></div>
                        <h3 className="sa-setting-title">Financial Settings</h3>
                    </div>
                    <div className="sa-setting-content">
                        <label className="sa-label">Platform Commission (%)</label>
                        <input 
                            type="number" step="0.1" 
                            className="sa-input sa-input-sm"
                            value={config.commission_rate}
                            onChange={e => setConfig({...config, commission_rate: e.target.value})}
                        />
                        <p className="sa-helper-text">This percentage is deducted from all hotel bookings.</p>
                    </div>
                </div>

                <hr className="sa-divider" />

                {/* Support */}
                <div className="sa-setting-section">
                    <div className="sa-setting-header">
                        <div className="sa-setting-icon sa-icon-support"><Mail size={20}/></div>
                        <h3 className="sa-setting-title">Support Contact</h3>
                    </div>
                    <div className="sa-setting-content">
                        <label className="sa-label">Admin Email</label>
                        <input 
                            type="email" 
                            className="sa-input sa-input-md"
                            value={config.support_email}
                            onChange={e => setConfig({...config, support_email: e.target.value})}
                        />
                    </div>
                </div>

                <hr className="sa-divider" />

                {/* System */}
                <div className="sa-setting-section">
                    <div className="sa-setting-header">
                        <div className="sa-setting-icon sa-icon-system"><Shield size={20}/></div>
                        <h3 className="sa-setting-title">System Control</h3>
                    </div>
                    <div className="sa-setting-content">
                        <label className="sa-checkbox-wrapper">
                            <input 
                                type="checkbox" 
                                className="sa-checkbox"
                                checked={!!config.maintenance_mode} // Ensure boolean
                                onChange={e => setConfig({...config, maintenance_mode: e.target.checked})}
                            />
                            <span style={{ fontWeight: 600, color: '#0f172a' }}>Enable Maintenance Mode</span>
                        </label>
                        <p className="sa-helper-text">
                            If enabled, users will see a "Under Maintenance" screen. Admins can still log in.
                        </p>
                    </div>
                </div>

                <button type="submit" disabled={loading} className="sa-btn-save">
                    <Save size={18}/> {loading ? 'Saving...' : 'Save Configuration'}
                </button>

                {msg && <p className={msg.includes('Error') ? 'sa-msg-error' : 'sa-msg-success'}>{msg}</p>}
            </form>
        </div>
    );
};
export default SuperSettings;