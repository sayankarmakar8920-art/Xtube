'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Settings,
  Play,
  Megaphone,
  Shield,
  HardDrive,
  Save,
  Globe,
  Volume2,
  Captions,
  Wifi,
  Lock,
  Clock,
  Ban,
  Cloud,
  FileVideo,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface SettingsSection {
  id: string
  title: string
  icon: React.ElementType
  description: string
}

const settingsSections: SettingsSection[] = [
  { id: 'general', title: 'General Settings', icon: Settings, description: 'Core platform configuration' },
  { id: 'streaming', title: 'Streaming Settings', icon: Play, description: 'Video playback preferences' },
  { id: 'ads', title: 'Ad Settings', icon: Megaphone, description: 'Advertising configuration' },
  { id: 'security', title: 'Security Settings', icon: Shield, description: 'Access and protection' },
  { id: 'storage', title: 'Storage Settings', icon: HardDrive, description: 'CDN and file storage' },
]

function SettingsCard({ children, section, delay }: { children: React.ReactNode; section: SettingsSection; delay: number }) {
  const Icon = section.icon
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="rounded-xl border border-white/5 bg-[#0f0f0f]/80 p-3 lg:p-5 hover:border-xtube-red/20 hover:shadow-[0_0_15px_rgba(229,9,20,0.1)] transition-colors"
    >
      <div className="flex items-center gap-3 mb-1">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-xtube-red/10">
          <Icon className="h-5 w-5 text-xtube-red" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">{section.title}</h3>
          <p className="text-sm text-xtube-text-secondary">{section.description}</p>
        </div>
      </div>
      <Separator className="my-4 bg-xtube-border" />
      {children}
    </motion.div>
  )
}

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between py-3">
      <div className="space-y-0.5">
        <Label className="text-sm font-medium text-white">{label}</Label>
        {description && <p className="text-xs text-xtube-text-secondary">{description}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  )
}

export function SettingsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [savingSection, setSavingSection] = useState<string | null>(null)

  // General
  const [siteName, setSiteName] = useState('Xtube')
  const [siteDescription, setSiteDescription] = useState('Premium streaming platform for high-quality video content.')
  const [defaultQuality, setDefaultQuality] = useState('auto')
  const [maintenanceMode, setMaintenanceMode] = useState(false)

  // Streaming
  const [autoplay, setAutoplay] = useState(true)
  const [defaultVolume, setDefaultVolume] = useState([75])
  const [subtitleLanguage, setSubtitleLanguage] = useState('en')
  const [adaptiveBitrate, setAdaptiveBitrate] = useState(true)

  // Ads
  const [adsEnabled, setAdsEnabled] = useState(true)
  const [maxAdsPerSession, setMaxAdsPerSession] = useState('5')
  const [adCooldown, setAdCooldown] = useState('120')
  const [preRollAds, setPreRollAds] = useState(true)
  const [midRollAds, setMidRollAds] = useState(true)
  const [postRollAds, setPostRollAds] = useState(false)
  const [overlayAds, setOverlayAds] = useState(true)

  // Security
  const [require2fa, setRequire2fa] = useState(true)
  const [sessionTimeout, setSessionTimeout] = useState('30')
  const [ipWhitelist, setIpWhitelist] = useState('')
  const [rateLimiting, setRateLimiting] = useState(true)

  // Storage
  const [bucketName, setBucketName] = useState('xtube-media')
  const [cdnDomain, setCdnDomain] = useState('cdn.xtube.io')
  const [maxFileSize, setMaxFileSize] = useState('500')
  const [allowedFormats, setAllowedFormats] = useState('mp4, webm, mkv, avi')

  const fetchSettings = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/settings')
      if (res.ok) {
        const data = await res.json()
        const kv = data.kv as Record<string, string>
        if (kv.siteName) setSiteName(kv.siteName)
        if (kv.siteDescription) setSiteDescription(kv.siteDescription)
        if (kv.defaultQuality) setDefaultQuality(kv.defaultQuality)
        if (kv.maintenanceMode) setMaintenanceMode(kv.maintenanceMode === 'true')
        if (kv.autoplay) setAutoplay(kv.autoplay === 'true')
        if (kv.defaultVolume) setDefaultVolume([Number(kv.defaultVolume)])
        if (kv.subtitleLanguage) setSubtitleLanguage(kv.subtitleLanguage)
        if (kv.adaptiveBitrate) setAdaptiveBitrate(kv.adaptiveBitrate === 'true')
        if (kv.adsEnabled) setAdsEnabled(kv.adsEnabled === 'true')
        if (kv.maxAdsPerSession) setMaxAdsPerSession(kv.maxAdsPerSession)
        if (kv.adCooldown) setAdCooldown(kv.adCooldown)
        if (kv.preRollAds) setPreRollAds(kv.preRollAds === 'true')
        if (kv.midRollAds) setMidRollAds(kv.midRollAds === 'true')
        if (kv.postRollAds) setPostRollAds(kv.postRollAds === 'true')
        if (kv.overlayAds) setOverlayAds(kv.overlayAds === 'true')
        if (kv.require2fa) setRequire2fa(kv.require2fa === 'true')
        if (kv.sessionTimeout) setSessionTimeout(kv.sessionTimeout)
        if (kv.ipWhitelist) setIpWhitelist(kv.ipWhitelist)
        if (kv.rateLimiting) setRateLimiting(kv.rateLimiting === 'true')
        if (kv.bucketName) setBucketName(kv.bucketName)
        if (kv.cdnDomain) setCdnDomain(kv.cdnDomain)
        if (kv.maxFileSize) setMaxFileSize(kv.maxFileSize)
        if (kv.allowedFormats) setAllowedFormats(kv.allowedFormats)
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const handleSave = async (section: string) => {
    setSavingSection(section)
    try {
      let entries: { key: string; value: string }[] = []

      if (section === 'general') {
        entries = [
          { key: 'siteName', value: siteName },
          { key: 'siteDescription', value: siteDescription },
          { key: 'defaultQuality', value: defaultQuality },
          { key: 'maintenanceMode', value: String(maintenanceMode) },
        ]
      } else if (section === 'streaming') {
        entries = [
          { key: 'autoplay', value: String(autoplay) },
          { key: 'defaultVolume', value: String(defaultVolume[0]) },
          { key: 'subtitleLanguage', value: subtitleLanguage },
          { key: 'adaptiveBitrate', value: String(adaptiveBitrate) },
        ]
      } else if (section === 'ads') {
        entries = [
          { key: 'adsEnabled', value: String(adsEnabled) },
          { key: 'maxAdsPerSession', value: maxAdsPerSession },
          { key: 'adCooldown', value: adCooldown },
          { key: 'preRollAds', value: String(preRollAds) },
          { key: 'midRollAds', value: String(midRollAds) },
          { key: 'postRollAds', value: String(postRollAds) },
          { key: 'overlayAds', value: String(overlayAds) },
        ]
      } else if (section === 'security') {
        entries = [
          { key: 'require2fa', value: String(require2fa) },
          { key: 'sessionTimeout', value: sessionTimeout },
          { key: 'ipWhitelist', value: ipWhitelist },
          { key: 'rateLimiting', value: String(rateLimiting) },
        ]
      } else if (section === 'storage') {
        entries = [
          { key: 'bucketName', value: bucketName },
          { key: 'cdnDomain', value: cdnDomain },
          { key: 'maxFileSize', value: maxFileSize },
          { key: 'allowedFormats', value: allowedFormats },
        ]
      }

      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entries),
      })

      if (res.ok) {
        toast({ title: 'Settings saved', description: `${section} settings saved successfully.` })
      } else {
        toast({ title: 'Save failed', description: `Failed to save ${section} settings.`, variant: 'destructive' })
      }
    } catch (err) {
      console.error('Failed to save settings:', err)
      toast({ title: 'Save failed', description: `Failed to save ${section} settings.`, variant: 'destructive' })
    } finally {
      setSavingSection(null)
    }
  }

  return (
    <div className="space-y-4 p-3 lg:p-5">
      {/* General Settings */}
      <SettingsCard section={settingsSections[0]} delay={0}>
        <div className="space-y-1">
          <SettingRow label="Site Name" description="The name displayed across the platform">
            <Input
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              className="border-xtube-border bg-xtube-bg text-white placeholder:text-xtube-text-secondary h-9 w-full sm:w-[250px]"
            />
          </SettingRow>
          <SettingRow label="Site Description" description="Brief description for SEO and meta tags">
            <Textarea
              value={siteDescription}
              onChange={(e) => setSiteDescription(e.target.value)}
              className="border-xtube-border bg-xtube-bg text-white placeholder:text-xtube-text-secondary min-h-[80px] w-full sm:w-[250px]"
            />
          </SettingRow>
          <SettingRow label="Default Video Quality" description="Default playback quality for new users">
            <Select value={defaultQuality} onValueChange={setDefaultQuality}>
              <SelectTrigger className="border-xtube-border bg-xtube-bg text-white h-9 w-full sm:w-[250px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-xtube-border bg-xtube-card text-white">
                <SelectItem value="auto">Auto (Recommended)</SelectItem>
                <SelectItem value="720p">720p HD</SelectItem>
                <SelectItem value="1080p">1080p Full HD</SelectItem>
                <SelectItem value="4k">4K Ultra HD</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>
          <SettingRow label="Maintenance Mode" description="Temporarily disable the site for maintenance">
            <Switch checked={maintenanceMode} onCheckedChange={setMaintenanceMode} />
          </SettingRow>
        </div>
        <div className="mt-4 flex justify-end">
          <Button
            onClick={() => handleSave('general')}
            className="bg-xtube-red hover:bg-xtube-red-hover text-white h-9 px-4"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </SettingsCard>

      {/* Streaming Settings */}
      <SettingsCard section={settingsSections[1]} delay={0.1}>
        <div className="space-y-1">
          <SettingRow label="Auto-play" description="Automatically play next video">
            <Switch checked={autoplay} onCheckedChange={setAutoplay} />
          </SettingRow>
          <SettingRow label="Default Volume" description={`Current: ${defaultVolume[0]}%`}>
            <div className="w-full sm:w-[250px] space-y-2">
              <Slider
                value={defaultVolume}
                onValueChange={setDefaultVolume}
                max={100}
                step={1}
                className="[&_[role=slider]]:bg-xtube-red [&_[role=slider]]:border-xtube-red"
              />
              <div className="flex items-center justify-between text-xs text-xtube-text-secondary">
                <Volume2 className="h-3.5 w-3.5" />
                <span>{defaultVolume[0]}%</span>
              </div>
            </div>
          </SettingRow>
          <SettingRow label="Subtitle Language" description="Default subtitle language">
            <Select value={subtitleLanguage} onValueChange={setSubtitleLanguage}>
              <SelectTrigger className="border-xtube-border bg-xtube-bg text-white h-9 w-full sm:w-[250px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-xtube-border bg-xtube-card text-white">
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="fr">French</SelectItem>
                <SelectItem value="de">German</SelectItem>
                <SelectItem value="ja">Japanese</SelectItem>
                <SelectItem value="zh">Chinese</SelectItem>
                <SelectItem value="ko">Korean</SelectItem>
                <SelectItem value="pt">Portuguese</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>
          <SettingRow label="Adaptive Bitrate" description="Automatically adjust quality based on connection">
            <Switch checked={adaptiveBitrate} onCheckedChange={setAdaptiveBitrate} />
          </SettingRow>
        </div>
        <div className="mt-4 flex justify-end">
          <Button
            onClick={() => handleSave('streaming')}
            className="bg-xtube-red hover:bg-xtube-red-hover text-white h-9 px-4"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </SettingsCard>

      {/* Ad Settings */}
      <SettingsCard section={settingsSections[2]} delay={0.2}>
        <div className="space-y-1">
          <SettingRow label="Ads Enabled" description="Enable or disable all advertising">
            <Switch checked={adsEnabled} onCheckedChange={setAdsEnabled} />
          </SettingRow>
          <SettingRow label="Max Ads Per Session" description="Maximum number of ads a user sees per session">
            <Input
              type="number"
              value={maxAdsPerSession}
              onChange={(e) => setMaxAdsPerSession(e.target.value)}
              min={0}
              max={50}
              className="border-xtube-border bg-xtube-bg text-white placeholder:text-xtube-text-secondary h-9 w-full sm:w-[250px]"
            />
          </SettingRow>
          <SettingRow label="Ad Cooldown (seconds)" description="Minimum time between ads in seconds">
            <Input
              type="number"
              value={adCooldown}
              onChange={(e) => setAdCooldown(e.target.value)}
              min={0}
              max={600}
              className="border-xtube-border bg-xtube-bg text-white placeholder:text-xtube-text-secondary h-9 w-full sm:w-[250px]"
            />
          </SettingRow>
          <Separator className="bg-xtube-border my-2" />
          <p className="text-sm font-medium text-white py-2">Ad Types</p>
          <SettingRow label="Pre-roll Ads" description="Ads shown before video starts">
            <Switch checked={preRollAds} onCheckedChange={setPreRollAds} />
          </SettingRow>
          <SettingRow label="Mid-roll Ads" description="Ads shown during video playback">
            <Switch checked={midRollAds} onCheckedChange={setMidRollAds} />
          </SettingRow>
          <SettingRow label="Post-roll Ads" description="Ads shown after video ends">
            <Switch checked={postRollAds} onCheckedChange={setPostRollAds} />
          </SettingRow>
          <SettingRow label="Overlay Ads" description="Banner ads displayed over the video">
            <Switch checked={overlayAds} onCheckedChange={setOverlayAds} />
          </SettingRow>
        </div>
        <div className="mt-4 flex justify-end">
          <Button
            onClick={() => handleSave('ads')}
            className="bg-xtube-red hover:bg-xtube-red-hover text-white h-9 px-4"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </SettingsCard>

      {/* Security Settings */}
      <SettingsCard section={settingsSections[3]} delay={0.3}>
        <div className="space-y-1">
          <SettingRow label="Admin 2FA Required" description="Require two-factor authentication for admin access">
            <Switch checked={require2fa} onCheckedChange={setRequire2fa} />
          </SettingRow>
          <SettingRow label="Session Timeout" description="Automatically log out after inactivity">
            <Select value={sessionTimeout} onValueChange={setSessionTimeout}>
              <SelectTrigger className="border-xtube-border bg-xtube-bg text-white h-9 w-full sm:w-[250px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-xtube-border bg-xtube-card text-white">
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="120">2 hours</SelectItem>
                <SelectItem value="480">8 hours</SelectItem>
                <SelectItem value="0">Never</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>
          <SettingRow label="IP Whitelist" description="One IP address per line. Leave empty to allow all.">
            <Textarea
              value={ipWhitelist}
              onChange={(e) => setIpWhitelist(e.target.value)}
              placeholder="192.168.1.0/24&#10;10.0.0.1"
              className="border-xtube-border bg-xtube-bg text-white placeholder:text-xtube-text-secondary min-h-[80px] w-full sm:w-[250px] font-mono text-sm"
            />
          </SettingRow>
          <SettingRow label="Rate Limiting" description="Protect against brute-force and DDoS attacks">
            <Switch checked={rateLimiting} onCheckedChange={setRateLimiting} />
          </SettingRow>
        </div>
        <div className="mt-4 flex justify-end">
          <Button
            onClick={() => handleSave('security')}
            className="bg-xtube-red hover:bg-xtube-red-hover text-white h-9 px-4"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </SettingsCard>

      {/* Storage Settings */}
      <SettingsCard section={settingsSections[4]} delay={0.4}>
        <div className="space-y-1">
          <SettingRow label="Cloudflare R2 Bucket" description="R2 bucket name for video storage">
            <Input
              value={bucketName}
              onChange={(e) => setBucketName(e.target.value)}
              className="border-xtube-border bg-xtube-bg text-white placeholder:text-xtube-text-secondary h-9 w-full sm:w-[250px]"
            />
          </SettingRow>
          <SettingRow label="CDN Domain" description="Custom CDN domain for fast content delivery">
            <Input
              value={cdnDomain}
              onChange={(e) => setCdnDomain(e.target.value)}
              className="border-xtube-border bg-xtube-bg text-white placeholder:text-xtube-text-secondary h-9 w-full sm:w-[250px]"
            />
          </SettingRow>
          <SettingRow label="Max File Size (MB)" description="Maximum upload file size in megabytes">
            <Input
              type="number"
              value={maxFileSize}
              onChange={(e) => setMaxFileSize(e.target.value)}
              min={1}
              max={10000}
              className="border-xtube-border bg-xtube-bg text-white placeholder:text-xtube-text-secondary h-9 w-full sm:w-[250px]"
            />
          </SettingRow>
          <SettingRow label="Allowed Formats" description="Comma-separated list of allowed video formats">
            <Input
              value={allowedFormats}
              onChange={(e) => setAllowedFormats(e.target.value)}
              className="border-xtube-border bg-xtube-bg text-white placeholder:text-xtube-text-secondary h-9 w-full sm:w-[250px]"
            />
          </SettingRow>
        </div>
        <div className="mt-4 flex justify-end">
          <Button
            onClick={() => handleSave('storage')}
            className="bg-xtube-red hover:bg-xtube-red-hover text-white h-9 px-4"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </SettingsCard>
    </div>
  )
}
