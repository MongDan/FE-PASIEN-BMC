import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-native'; 
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';

// Import komponen dan utils
import { 
  COLORS, 
  BASE_URL_PATIENT, 
  getTokenFromStorage, 
  decodeJwtPayload, 
  cleanNumberString,
  getDjjStatus,
  getDilatationPhase,
  getLatestFilledPartografData 
} from '../../utils/global';

import HeaderTop from '../../components/HeaderTop';
import HeaderGradient from '../../components/HeaderGradient';
import MidwifeCard from '../../components/MidwifeCard';
import DilatationVisualizer from '../../components/DilatationVisualizer';
import DjjStatusCard from '../../components/DjjStatusCard';
import IbuStatusCard from '../../components/IbuStatusCard';
import BottomTabBar from '../../components/BottomTabBar';

export default function MainScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pasienName, setPasienName] = useState('');

  const [bidanName, setBidanName] = useState('Memuat Bidan...');
  const [pembukaan, setPembukaan] = useState(0);

  const [djj, setDjj] = useState(0);
  const [sistolik, setSistolik] = useState('---');
  const [diastolik, setDiastolik] = useState('---');
  const [nadi, setNadi] = useState('---');
  const [suhu, setSuhu] = useState('---');

  const [waktuCatat, setWaktuCatat] = useState('');

  const [djjStatus, setDjjStatus] = useState({ text: 'Memuat', color: COLORS.textSecondary, message: 'Memuat...' });
  const navigate = useNavigate();

  const fetchBidanData = async (pasienId, token) => {
    try {
      const BIDAN_URL = `${BASE_URL_PATIENT}/${pasienId}/bidanId`;
      const res = await fetch(BIDAN_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();

      if (json.bidan_nama) {
        setBidanName(json.bidan_nama.trim() || 'Bidan');
      } else {
        setBidanName('Bidan Tidak Ditemukan');
      }
    } catch (err) {
      console.log('ERROR FETCH BIDAN:', err.message);
      setBidanName('Error Memuat Bidan');
    }
  };

  const fetchPartografData = async (pasienId, token) => {
    try {
      const PARTOGRAF_URL = `${BASE_URL_PATIENT}/${pasienId}/progres-persalinan`;
      const res = await fetch(PARTOGRAF_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const resetPartografState = (message) => {
          console.log(message);
          setPembukaan(0);
          setDjj(0);
          setSistolik('---'); setDiastolik('---');
          setNadi('---'); setSuhu('---');
          setWaktuCatat('---');
          setDjjStatus(getDjjStatus(0));
      }

      if (!res.ok) {
        const errorJson = await res.json();
        const errorMessage = errorJson.message || 'Unknown error';

        if (errorMessage.includes('Belum ada catatan partograf') || res.status === 404) {
             resetPartografState('WARNING FETCH PARTOGRAF: Data partograf belum tersedia.');
             return; 
        }

        throw new Error(`Partograf fetch failed: ${errorMessage}`);
      }

      const json = await res.json();
      const dataArray = json.data;

      if (!dataArray || dataArray.length === 0) {
        resetPartografState('WARNING FETCH PARTOGRAF: Data partograf kosong dari API.');
        return;
      }

      const latestData = getLatestFilledPartografData(dataArray);

      if (!latestData) {
        resetPartografState("Could not process latest Partograph data.");
        return;
      }

      const rawPembukaan = parseFloat(latestData.pembukaan_servik) || 0;
      const rawDjj = parseFloat(latestData.djj) || 0;
      
      setPembukaan(rawPembukaan);
      setDjj(rawDjj);

      setSistolik(cleanNumberString(latestData.sistolik));
      setDiastolik(cleanNumberString(latestData.diastolik));
      setNadi(cleanNumberString(latestData.nadi_ibu));
      setSuhu(cleanNumberString(latestData.suhu_ibu, true)); 

      setWaktuCatat(latestData.waktu_catat || '---');

      setDjjStatus(getDjjStatus(rawDjj));
    } catch (err) {
      console.log('ERROR FETCH PARTOGRAF:', err.message);
      setPembukaan(0);
      setDjj(0);
      setSistolik('---'); setDiastolik('---');
      setNadi('---'); setSuhu('---');
      setWaktuCatat('---');
      setDjjStatus(getDjjStatus(0));
    }
  };

  const fetchData = useCallback(async () => {
    const isInitialLoad = loading && !refreshing;

    try {
      if (!isInitialLoad) {
        setRefreshing(true);
      }

      const token = await getTokenFromStorage();
      if (!token) {
        console.log('No token found, navigating to login'); 
        navigate('/login');
        return;
      }

      const { pasienId, pasienName } = decodeJwtPayload(token);
      setPasienName(pasienName);

      await Promise.all([
        fetchBidanData(pasienId, token),
        fetchPartografData(pasienId, token)
      ]);

    } catch (err) {
      console.log('GENERAL ERROR:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loading, refreshing, navigate]); 

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    fetchData();
  }, [fetchData]);


  if (loading) {
    return (
      <View style={styles.loadingWrapper}>
        <ActivityIndicator size="large" color={COLORS.primaryBlue} />
        <Text style={styles.loadingText}>Memuat data dashboard...</Text>
      </View>
    );
  }

  const activePhase = getDilatationPhase(pembukaan);

  return (
    <View style={styles.containerFixed}>
      <ScrollView
        style={styles.scrollViewContent}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primaryBlue}
            colors={[COLORS.primaryBlue]}
          />
        }
      >
        {/* HEADER ATAS (LOGO & NOTIF) */}
        <HeaderTop />

        {/* GRADIENT & WELCOME */}
        <HeaderGradient pasienName={pasienName} />

        {/* CARD BIDAN */}
        <MidwifeCard
          bidanName={bidanName}
          activePhase={activePhase}
          waktuCatat={waktuCatat}
        />

        {/* VISUALISASI PEMBUKAAN (FOKUS 1) */}
        <DilatationVisualizer pembukaan={pembukaan} />

        {/* DJJ STATUS CARD (FOKUS 2 - STATUS AMAN/BAHAYA) */}
        <DjjStatusCard djj={djj} djjStatus={djjStatus} />

        {/* IBU STATUS CARD (FOKUS 3 - STATUS KESEHATAN IBU DENGAN BAHASA AWAM) */}
        <IbuStatusCard
            sistolik={sistolik}
            diastolik={diastolik}
            nadi={nadi}
            suhu={suhu}
        />
        
        <View style={{height: 20}} />

      </ScrollView>

      <BottomTabBar navigate={navigate} />
    </View>
  );
}

const styles = StyleSheet.create({
  containerFixed: {
    flex: 1,
    backgroundColor: COLORS.offWhite, 
  },
  scrollViewContent: {
    flex: 1,
    backgroundColor: COLORS.offWhite,
  },
  loadingWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.textSecondary,
    fontSize: 14,
  },
});