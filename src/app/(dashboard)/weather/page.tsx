"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HeaderHero } from "@/components/layout/header-hero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { getUserLocation, updateUserLocation } from "@/app/actions/weather";
import { useState, useEffect, useCallback } from "react";
import { MapPin, Sun, Cloud, Moon, Search, Sunrise, Sunset, Clock, Eye, Wind, Droplets, Thermometer, ChevronRight } from "lucide-react";
import { KpiBlock } from "@/components/ui/kpi-block";
import { KpiValue } from "@/components/ui/kpi-value";

// --- Moon Phase Calculation (synodic cycle algorithm) ---
function getMoonPhase(date: Date): { phase: number; name: string; emoji: string } {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    // Conway's algorithm for moon phase
    let r = year % 100;
    r %= 19;
    if (r > 9) r -= 19;
    r = ((r * 11) % 30) + month + day;
    if (month < 3) r += 2;
    r -= ((year < 2000) ? 4 : 8.3);
    r = Math.floor(r + 0.5) % 30;
    if (r < 0) r += 30;

    const phase = r;
    let name: string;
    let emoji: string;

    if (phase === 0) { name = "New Moon"; emoji = "🌑"; }
    else if (phase < 7) { name = "Waxing Crescent"; emoji = "🌒"; }
    else if (phase === 7) { name = "First Quarter"; emoji = "🌓"; }
    else if (phase < 15) { name = "Waxing Gibbous"; emoji = "🌔"; }
    else if (phase === 15) { name = "Full Moon"; emoji = "🌕"; }
    else if (phase < 22) { name = "Waning Gibbous"; emoji = "🌖"; }
    else if (phase === 22) { name = "Last Quarter"; emoji = "🌗"; }
    else { name = "Waning Crescent"; emoji = "🌘"; }

    return { phase, name, emoji };
}

// --- Weather Code to Description ---
function weatherCodeToInfo(code: number): { desc: string; icon: string } {
    if (code === 0) return { desc: "Clear Sky", icon: "☀️" };
    if (code <= 3) return { desc: "Partly Cloudy", icon: "⛅" };
    if (code <= 48) return { desc: "Foggy", icon: "🌫️" };
    if (code <= 57) return { desc: "Drizzle", icon: "🌦️" };
    if (code <= 67) return { desc: "Rain", icon: "🌧️" };
    if (code <= 77) return { desc: "Snow", icon: "🌨️" };
    if (code <= 82) return { desc: "Rain Showers", icon: "🌧️" };
    if (code <= 86) return { desc: "Snow Showers", icon: "🌨️" };
    if (code <= 99) return { desc: "Thunderstorm", icon: "⛈️" };
    return { desc: "Unknown", icon: "❓" };
}

// --- Solar Noon Calculation ---
function calcSolarNoon(sunrise: string, sunset: string): string {
    const sr = new Date(sunrise);
    const ss = new Date(sunset);
    const noon = new Date((sr.getTime() + ss.getTime()) / 2);
    return noon.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

// --- Moonrise / Moonset Approximation (based on moon phase) ---
function approxMoonTimes(phase: number, sunrise: string, sunset: string): { rise: string; set: string } {
    const sr = new Date(sunrise);
    const ss = new Date(sunset);
    const dayLength = ss.getTime() - sr.getTime();
    const phaseRatio = phase / 29.5;

    // Approximate: New Moon rises/sets with sun; Full Moon opposite
    const riseOffset = phaseRatio * 12 * 3600000; // shift by up to 12 hours
    const moonrise = new Date(sr.getTime() + riseOffset);
    const moonset = new Date(moonrise.getTime() + dayLength);

    return {
        rise: moonrise.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
        set: moonset.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
    };
}

type GeoResult = { name: string; admin1?: string; country: string; latitude: number; longitude: number };
type DailyData = {
    time: string[];
    sunrise: string[];
    sunset: string[];
    uv_index_max: number[];
    weathercode: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
    windgusts_10m_max: number[];
};
type HourlyData = {
    time: string[];
    shortwave_radiation: number[];
    temperature_2m: number[];
    apparent_temperature: number[];
    weathercode: number[];
    cloudcover: number[];
    windspeed_10m: number[];
    windgusts_10m: number[];
    relative_humidity_2m: number[];
    dewpoint_2m: number[];
    visibility: number[];
    precipitation_probability: number[];
};

export default function WeatherPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<GeoResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);

    const [locationName, setLocationName] = useState<string | null>(null);
    const [lat, setLat] = useState<string | null>(null);
    const [lon, setLon] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const [dailyData, setDailyData] = useState<DailyData | null>(null);
    const [hourlyData, setHourlyData] = useState<HourlyData | null>(null);
    const [isLoadingWeather, setIsLoadingWeather] = useState(false);

    // Load saved location on mount
    useEffect(() => {
        getUserLocation().then(res => {
            if (res.success && res.data?.lat && res.data?.lon) {
                setLocationName(res.data.name);
                setLat(res.data.lat);
                setLon(res.data.lon);
            }
        });
    }, []);

    // Fetch weather when lat/lon change
    const fetchWeather = useCallback(async (latitude: string, longitude: string) => {
        setIsLoadingWeather(true);
        try {
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=sunrise,sunset,uv_index_max,weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max,windgusts_10m_max&hourly=shortwave_radiation,temperature_2m,apparent_temperature,weathercode,cloudcover,windspeed_10m,windgusts_10m,relative_humidity_2m,dewpoint_2m,visibility,precipitation_probability&timezone=auto&forecast_days=16`;
            const res = await fetch(url);
            const data = await res.json();
            setDailyData(data.daily);
            setHourlyData(data.hourly);
        } catch (err) {
            console.error("Weather fetch failed:", err);
            toast.error("Failed to load weather data");
        }
        setIsLoadingWeather(false);
    }, []);

    useEffect(() => {
        if (lat && lon) fetchWeather(lat, lon);
    }, [lat, lon, fetchWeather]);

    // Geocoding search
    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        setShowResults(true);
        try {
            const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchQuery)}&count=5&language=en&format=json`);
            const data = await res.json();
            setSearchResults(data.results || []);
        } catch {
            toast.error("Location search failed");
        }
        setIsSearching(false);
    };

    // Select a geocoding result
    const selectLocation = (result: GeoResult) => {
        const name = `${result.name}${result.admin1 ? `, ${result.admin1}` : ""}, ${result.country}`;
        setLocationName(name);
        setLat(result.latitude.toString());
        setLon(result.longitude.toString());
        setShowResults(false);
        setSearchQuery("");
    };

    // Save location to DB
    const saveLocation = async () => {
        if (!locationName || !lat || !lon) return;
        setIsSaving(true);
        const res = await updateUserLocation(locationName, lat, lon);
        if (res.success) {
            toast.success("Location saved!");
        } else {
            toast.error(res.error || "Failed to save location");
        }
        setIsSaving(false);
    };

    // --- Derived Weather Values ---
    const todayIndex = 0;
    const sunrise = dailyData?.sunrise?.[todayIndex] || "";
    const sunset = dailyData?.sunset?.[todayIndex] || "";
    const solarNoon = sunrise && sunset ? calcSolarNoon(sunrise, sunset) : "--";

    // Peak Sun Hours: sum hourly shortwave_radiation for today / 1000
    let peakSunHours = 0;
    if (hourlyData && dailyData) {
        const todayStr = dailyData.time[todayIndex];
        hourlyData.time.forEach((t, i) => {
            if (t.startsWith(todayStr)) {
                peakSunHours += (hourlyData.shortwave_radiation[i] || 0) / 1000;
            }
        });
    }

    // Current conditions (nearest hour)
    let currentTemp = 0;
    let currentFeelsLike = 0;
    let currentCloud = 0;
    let currentWind = 0;
    let currentWindGust = 0;
    let currentHumidity = 0;
    let currentDewpoint = 0;
    let currentVisibility = 0;
    let currentPrecipProb = 0;
    let currentWeatherCode = 0;
    if (hourlyData) {
        const now = new Date();
        const currentHour = now.getHours();
        const todayStr = dailyData?.time?.[todayIndex] || "";
        const hourIndex = hourlyData.time.findIndex(t => {
            if (!t.startsWith(todayStr)) return false;
            const h = new Date(t).getHours();
            return h === currentHour;
        });
        if (hourIndex >= 0) {
            currentTemp = hourlyData.temperature_2m[hourIndex] || 0;
            currentFeelsLike = hourlyData.apparent_temperature[hourIndex] || 0;
            currentCloud = hourlyData.cloudcover[hourIndex] || 0;
            currentWind = hourlyData.windspeed_10m[hourIndex] || 0;
            currentWindGust = hourlyData.windgusts_10m[hourIndex] || 0;
            currentHumidity = hourlyData.relative_humidity_2m[hourIndex] || 0;
            currentDewpoint = hourlyData.dewpoint_2m[hourIndex] || 0;
            currentVisibility = hourlyData.visibility[hourIndex] || 0;
            currentPrecipProb = hourlyData.precipitation_probability[hourIndex] || 0;
            currentWeatherCode = hourlyData.weathercode[hourIndex] || 0;
        }
    }

    // Moon data
    const today = new Date();
    const moonToday = getMoonPhase(today);
    const moonTimes = sunrise && sunset ? approxMoonTimes(moonToday.phase, sunrise, sunset) : { rise: "--", set: "--" };

    // Temp conversion helper
    const toF = (c: number) => Math.round(c * 9 / 5 + 32);

    const currentWeather = weatherCodeToInfo(currentWeatherCode);

    return (
        <div className="container mx-auto py-10 px-4 md:px-8 max-w-6xl">
            <HeaderHero
                title="Weather, Sun & Moon"
                description="Daily solar, weather, and moon data for your location."
                imageUrl="/images/page-headers/rvmp-weather-header.jpg"
            />

            {/* KPI Row */}
            {dailyData && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 mt-6">
                    <KpiBlock label="Peak Sun Hours" variant="solar">
                        <KpiValue>{peakSunHours.toFixed(1)} <span className="text-sm font-normal">hrs</span></KpiValue>
                    </KpiBlock>
                    <KpiBlock label="UV Index" variant="solar">
                        <KpiValue>{dailyData.uv_index_max?.[todayIndex]?.toFixed(0) || "—"}</KpiValue>
                    </KpiBlock>
                    <KpiBlock label="Cloud Cover" variant="solar">
                        <KpiValue>{currentCloud}%</KpiValue>
                    </KpiBlock>
                    <KpiBlock label="Current Temp" variant="solar">
                        <KpiValue>{toF(currentTemp)}°F</KpiValue>
                    </KpiBlock>
                </div>
            )}

            {/* Location Card */}
            <Card className="mb-6">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-bold text-slate-800">
                        Your Location
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {locationName && (
                        <div className="mb-4 p-3 bg-brand-primary/5 rounded-lg border border-brand-primary/15 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">Current Location</p>
                                <p className="text-lg font-semibold text-slate-800">{locationName}</p>
                            </div>
                            <MapPin className="w-5 h-5 text-brand-primary" />
                        </div>
                    )}
                    <div className="relative">
                        <p className="text-sm text-slate-500 mb-2">Type your location and hit Enter to prompt the database.</p>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    placeholder="Search city, state, or zipcode..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    onKeyDown={e => e.key === "Enter" && handleSearch()}
                                    className="pl-9"
                                />
                            </div>
                            <Button onClick={handleSearch} disabled={isSearching} variant="outline">
                                {isSearching ? "..." : "Search"}
                            </Button>
                            {locationName && (
                                <Button onClick={saveLocation} disabled={isSaving} className="bg-brand-primary hover:bg-brand-primary-dark text-white">
                                    {isSaving ? "Saving..." : "Update Location"}
                                </Button>
                            )}
                        </div>

                        {/* Search Results Dropdown */}
                        {showResults && searchResults.length > 0 && (
                            <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
                                {searchResults.map((r, i) => (
                                    <button
                                        key={i}
                                        onClick={() => selectLocation(r)}
                                        className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 flex items-center gap-3"
                                    >
                                        <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                        <div>
                                            <p className="text-sm font-medium text-slate-800">{r.name}</p>
                                            <p className="text-xs text-slate-500">{r.admin1 ? `${r.admin1}, ` : ""}{r.country}</p>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-slate-300 ml-auto" />
                                    </button>
                                ))}
                            </div>
                        )}
                        {showResults && searchResults.length === 0 && !isSearching && (
                            <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg p-4 text-center text-sm text-slate-500">
                                No locations found. Try a different search.
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {!dailyData && !isLoadingWeather && (
                <Card className="mb-6">
                    <CardContent className="py-16 text-center">
                        <Sun className="w-12 h-12 text-amber-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-slate-700 mb-2">Search for your location above</h3>
                        <p className="text-sm text-slate-500">Enter a city, state, or zipcode to see weather, solar, and moon data.</p>
                    </CardContent>
                </Card>
            )}

            {isLoadingWeather && (
                <Card className="mb-6">
                    <CardContent className="py-16 text-center">
                        <div className="animate-spin w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full mx-auto mb-4" />
                        <p className="text-sm text-slate-500">Loading weather data...</p>
                    </CardContent>
                </Card>
            )}

            {dailyData && !isLoadingWeather && (
                <>
                    {/* Solar Data — uses global KPI blocks matching Power System page */}
                    <Card className="p-6 bg-slate-50 mb-8">
                        <h3 className="text-lg font-medium text-slate-800 mb-4">
                            Solar Data
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <KpiBlock label="Sunrise" variant="solar">
                                <KpiValue>
                                    {new Date(sunrise).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                                </KpiValue>
                            </KpiBlock>
                            <KpiBlock label="Solar Noon" variant="solar">
                                <KpiValue>{solarNoon}</KpiValue>
                            </KpiBlock>
                            <KpiBlock label="Sunset" variant="solar">
                                <KpiValue>
                                    {new Date(sunset).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                                </KpiValue>
                            </KpiBlock>
                            <KpiBlock label="Peak Sun Hours" variant="solar">
                                <KpiValue>{peakSunHours.toFixed(1)} <span className="text-sm font-normal">hrs</span></KpiValue>
                            </KpiBlock>
                            <KpiBlock label="UV Index" variant="solar">
                                <KpiValue>{dailyData.uv_index_max?.[todayIndex]?.toFixed(0) || "—"}</KpiValue>
                            </KpiBlock>
                        </div>
                    </Card>

                    {/* Weather Forecast Card */}
                    <Card className="mb-6">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg font-bold text-slate-800">
                                Weather Forecast
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {/* Current Conditions */}
                            <div className="p-5 bg-gradient-to-r from-blue-50 to-sky-50 rounded-xl border border-blue-100 mb-6">
                                <div className="flex items-center gap-6 mb-4">
                                    <div className="text-5xl">{currentWeather.icon}</div>
                                    <div>
                                        <p className="text-3xl font-bold text-slate-800">{toF(currentTemp)}°F</p>
                                        <p className="text-sm text-slate-600">{currentWeather.desc}</p>
                                        <p className="text-xs text-slate-400">Feels like {toF(currentFeelsLike)}°F</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 md:grid-cols-6 gap-4 text-center">
                                    <div>
                                        <p className="text-sm font-semibold text-brand-primary mb-1">Wind</p>
                                        <p className="text-lg font-bold text-slate-800">{Math.round(currentWind * 0.621)} mph</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-brand-primary mb-1">Gusts</p>
                                        <p className="text-lg font-bold text-slate-800">{Math.round(currentWindGust * 0.621)} mph</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-brand-primary mb-1">Humidity</p>
                                        <p className="text-lg font-bold text-slate-800">{currentHumidity}%</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-brand-primary mb-1">Dew Point</p>
                                        <p className="text-lg font-bold text-slate-800">{toF(currentDewpoint)}°F</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-brand-primary mb-1">Visibility</p>
                                        <p className="text-lg font-bold text-slate-800">{Math.round(currentVisibility / 1609)} mi</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-brand-primary mb-1">Rain %</p>
                                        <p className="text-lg font-bold text-slate-800">{currentPrecipProb}%</p>
                                    </div>
                                </div>
                            </div>

                            {/* 16-Day Forecast */}
                            <h4 className="text-sm font-semibold text-slate-600 mb-3">16-Day Forecast</h4>
                            <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                                {dailyData.time.map((day, i) => {
                                    const d = new Date(day + "T12:00:00");
                                    const dayName = i === 0 ? "Today" : d.toLocaleDateString("en-US", { weekday: "short" });
                                    const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                                    const info = weatherCodeToInfo(dailyData.weathercode[i]);
                                    const precipProb = dailyData.precipitation_probability_max?.[i] || 0;
                                    const gustMph = Math.round((dailyData.windgusts_10m_max?.[i] || 0) * 0.621);
                                    return (
                                        <div key={day} className={`text-center p-2.5 rounded-lg border ${i === 0 ? "bg-blue-50 border-blue-200" : "bg-slate-50 border-slate-100"}`}>
                                            <p className="text-xs font-semibold text-slate-600">{dayName}</p>
                                            <p className="text-[10px] text-slate-400 mb-1">{dateStr}</p>
                                            <p className="text-xl mb-1">{info.icon}</p>
                                            <p className="text-sm font-bold text-slate-800">{toF(dailyData.temperature_2m_max[i])}°</p>
                                            <p className="text-xs text-slate-400 mb-1">{toF(dailyData.temperature_2m_min[i])}°</p>
                                            {precipProb > 0 && (
                                                <p className="text-[10px] text-blue-500 font-medium">💧 {precipProb}%</p>
                                            )}
                                            {gustMph > 20 && (
                                                <p className="text-[10px] text-orange-500 font-medium">💨 {gustMph}</p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Moon Card */}
                    <Card className="mb-6">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg font-bold text-slate-800">
                                Moon Phases
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {/* Today's Moon */}
                            <div className="flex items-center gap-6 p-4 bg-gradient-to-r from-indigo-50 to-violet-50 rounded-xl border border-indigo-100 mb-6">
                                <div className="text-5xl">{moonToday.emoji}</div>
                                <div>
                                    <p className="text-xl font-bold text-slate-800">{moonToday.name}</p>
                                    <p className="text-sm text-slate-500">Day {moonToday.phase} of 29.5-day cycle</p>
                                </div>
                                <div className="ml-auto grid grid-cols-2 gap-6 text-center">
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">Moonrise</p>
                                        <p className="text-sm font-semibold text-slate-800">{moonTimes.rise}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">Moonset</p>
                                        <p className="text-sm font-semibold text-slate-800">{moonTimes.set}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Monthly Moon Phase Calendar */}
                            <h3 className="text-sm font-semibold text-slate-600 mb-3">
                                {today.toLocaleDateString("en-US", { month: "long", year: "numeric" })} Moon Calendar
                            </h3>
                            <div className="grid grid-cols-7 gap-2 bg-slate-800 rounded-xl p-4">
                                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                                    <div key={d} className="text-center text-xs font-semibold text-slate-400 py-2 border-b border-slate-600">{d}</div>
                                ))}
                                {(() => {
                                    const year = today.getFullYear();
                                    const month = today.getMonth();
                                    const firstDay = new Date(year, month, 1).getDay();
                                    const daysInMonth = new Date(year, month + 1, 0).getDate();
                                    const cells: React.ReactNode[] = [];

                                    // Empty cells for days before the 1st
                                    for (let i = 0; i < firstDay; i++) {
                                        cells.push(<div key={`empty-${i}`} />);
                                    }

                                    for (let d = 1; d <= daysInMonth; d++) {
                                        const date = new Date(year, month, d);
                                        const mp = getMoonPhase(date);
                                        const isToday = d === today.getDate();
                                        cells.push(
                                            <div
                                                key={d}
                                                className={`text-center py-2 px-1 rounded-lg transition-colors ${isToday
                                                    ? "bg-indigo-500/30 border-2 border-indigo-400 shadow-sm"
                                                    : "hover:bg-slate-700 border border-transparent"
                                                }`}
                                            >
                                                <p className={`text-xs font-medium mb-1 ${isToday ? "text-indigo-300 font-bold" : "text-slate-500"}`}>{d}</p>
                                                <p className="text-2xl leading-none mb-1">{mp.emoji}</p>
                                                <p className={`text-[10px] leading-tight ${isToday ? "text-indigo-300 font-semibold" : "text-slate-500"}`}>{mp.name}</p>
                                            </div>
                                        );
                                    }

                                    return cells;
                                })()}
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}
