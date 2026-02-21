import { useState, useEffect } from 'react';
import platformService from '../../services/platformService';
import { Save, Shield, Percent, Mail, MapPin, Phone, Share2 } from 'lucide-react';
import './styles/super-settings.css';

const SuperSettings = () => {
    // Added the new fields to the initial state
    const [config, setConfig] = useState({ 
        commission_rate: 5.0, 
        support_email: '', 
        maintenance_mode: false,
        office_address: '',
        contact_phone: '',
        facebook_url: '',
        twitter_url: '',
        instagram_url: ''
    });
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const data = await platformService.getSettings();
                // Merge DB data with defaults so inputs don't break if null
                if (data) setConfig(prev => ({ ...prev, ...data }));
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
            <h1 className="sa-page-title" style={{marginBottom: '5px'}}>Platform Configuration</h1>
            <p className="sa-page-subtitle" style={{marginBottom: '30px'}}>Manage global system parameters.</p>

            <form onSubmit={handleSave} className="sa-settings-form">
                
                {/* --- FINANCIAL SETTINGS --- */}
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
                        <p className="sa-helper-text">This percentage is deducted automatically from all hotel bookings.</p>
                    </div>
                </div>

                <hr className="sa-divider" />

                {/* --- COMPANY CONTACT DETAILS --- */}
                <div className="sa-setting-section">
                    <div className="sa-setting-header">
                        <div className="sa-setting-icon sa-icon-support"><MapPin size={20}/></div>
                        <h3 className="sa-setting-title">Company Contact Details</h3>
                    </div>
                    <div className="sa-setting-content">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div>
                                <label className="sa-label">Office Address</label>
                                <input 
                                    type="text" 
                                    className="sa-input sa-input-md"
                                    value={config.office_address || ''}
                                    onChange={e => setConfig({...config, office_address: e.target.value})}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '20px' }}>
                                <div>
                                    <label className="sa-label">Support Email</label>
                                    <input 
                                        type="email" 
                                        className="sa-input sa-input-md"
                                        value={config.support_email || ''}
                                        onChange={e => setConfig({...config, support_email: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="sa-label">Contact Phone</label>
                                    <input 
                                        type="text" 
                                        className="sa-input sa-input-md"
                                        value={config.contact_phone || ''}
                                        onChange={e => setConfig({...config, contact_phone: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <hr className="sa-divider" />

                {/* --- SOCIAL MEDIA LINKS --- */}
                <div className="sa-setting-section">
                    <div className="sa-setting-header">
                        <div className="sa-setting-icon sa-icon-finance" style={{background: '#e0e7ff', color: '#4f46e5'}}><Share2 size={20}/></div>
                        <h3 className="sa-setting-title">Social Media Links</h3>
                    </div>
                    <div className="sa-setting-content" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div>
                            <label className="sa-label">Facebook URL</label>
                            <input 
                                type="url" placeholder="https://facebook.com/..."
                                className="sa-input sa-input-md"
                                value={config.facebook_url || ''}
                                onChange={e => setConfig({...config, facebook_url: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="sa-label">Twitter/X URL</label>
                            <input 
                                type="url" placeholder="https://twitter.com/..."
                                className="sa-input sa-input-md"
                                value={config.twitter_url || ''}
                                onChange={e => setConfig({...config, twitter_url: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="sa-label">Instagram URL</label>
                            <input 
                                type="url" placeholder="https://instagram.com/..."
                                className="sa-input sa-input-md"
                                value={config.instagram_url || ''}
                                onChange={e => setConfig({...config, instagram_url: e.target.value})}
                            />
                        </div>
                    </div>
                </div>

                <hr className="sa-divider" />

                {/* --- SYSTEM CONTROL --- */}
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
                                checked={!!config.maintenance_mode} 
                                onChange={e => setConfig({...config, maintenance_mode: e.target.checked})}
                            />
                            <span style={{ fontWeight: 700, color: 'var(--color-dark)' }}>Enable Maintenance Mode</span>
                        </label>
                        <p className="sa-helper-text">
                            If enabled, standard users will see an "Under Maintenance" screen. Super Admins can still log in.
                        </p>
                    </div>
                </div>

                <div className="sa-form-footer">
                    <button type="submit" disabled={loading} className="sa-btn-save">
                        <Save size={18}/> {loading ? 'Saving...' : 'Save Configuration'}
                    </button>
                    {msg && <p className={msg.includes('Error') ? 'sa-msg-error' : 'sa-msg-success'}>{msg}</p>}
                </div>
            </form>
        </div>
    );
};
export default SuperSettings;