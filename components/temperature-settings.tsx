'use client';

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Save, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ThresholdSettings {
  high_threshold: number;
  low_threshold: number;
}

export default function TemperatureSettings() {
  const [settings, setSettings] = useState<ThresholdSettings>({
    high_threshold: 28,
    low_threshold: 20
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [inputValues, setInputValues] = useState({
    high: '',
    low: ''
  });

  // Fetch current threshold settings
  useEffect(() => {
    async function fetchSettings() {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch("/api/settings/thresholds");
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        setSettings(data);
        setInputValues({
          high: data.high_threshold.toString(),
          low: data.low_threshold.toString()
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(`Kan instellingen niet laden: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    }
    
    fetchSettings();
  }, []);

  // Save updated thresholds
  const saveSettings = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const highValue = parseFloat(inputValues.high);
      const lowValue = parseFloat(inputValues.low);
      
      // Basic validation
      if (isNaN(highValue) || isNaN(lowValue)) {
        throw new Error("Beide waarden moeten geldige getallen zijn");
      }
      
      if (highValue <= lowValue) {
        throw new Error("Bovengrens moet hoger zijn dan ondergrens");
      }

      const response = await fetch("/api/settings/thresholds", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          high_threshold: highValue,
          low_threshold: lowValue
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      setSettings(data);
      setSuccess("Temperatuur drempelwaarden succesvol bijgewerkt");
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="overflow-hidden border shadow-lg bg-white/90 dark:bg-slate-900/90">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Temperatuur Instellingen</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 text-slate-400 animate-spin" />
          </div>
        ) : (
          <>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="ml-2">{error}</AlertDescription>
              </Alert>
            )}
            
            {success && (
              <Alert className="mb-4 bg-green-50 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800">
                <AlertDescription className="ml-2">{success}</AlertDescription>
              </Alert>
            )}
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Bovengrens temperatuur (°C)
                <span className="text-amber-500 ml-1 font-semibold">{settings?.high_threshold}</span>
              </label>
              <Input
                type="number"
                step="0.1"
                placeholder="Bovengrens"
                value={inputValues.high}
                onChange={(e) => setInputValues(prev => ({...prev, high: e.target.value}))}
                className="w-full"
              />
              <p className="text-xs text-slate-500 mt-1">
                Waarschuwing bij temperaturen boven deze waarde
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Ondergrens temperatuur (°C)
                <span className="text-blue-500 ml-1 font-semibold">{settings?.low_threshold}</span>
              </label>
              <Input
                type="number"
                step="0.1"
                placeholder="Ondergrens"
                value={inputValues.low}
                onChange={(e) => setInputValues(prev => ({...prev, low: e.target.value}))}
                className="w-full"
              />
              <p className="text-xs text-slate-500 mt-1">
                Waarschuwing bij temperaturen onder deze waarde
              </p>
            </div>
          </>
        )}
      </CardContent>
      <CardFooter className="bg-slate-50 dark:bg-slate-800/50 flex justify-end pt-4">
        <Button 
          onClick={saveSettings} 
          disabled={loading || saving}
          className="flex items-center"
        >
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Instellingen opslaan
        </Button>
      </CardFooter>
    </Card>
  );
}
