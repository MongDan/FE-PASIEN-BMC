import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-native'; 
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    SafeAreaView,
    Platform,
    Dimensions,
    Animated,
    Easing
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons'; 

// URL API yang disediakan
const API_URL = 'https://restful-api-bmc-production.up.railway.app/api/konten-edukasi';

// Warna dan Konstanta Desain (Dipertahankan dan ditingkatkan)
const COLORS = {
    primary: '#007BFF',      
    secondary: '#28A745',    
    background: '#F8F9FA',   
    card: '#FFFFFF',         
    textDark: '#333333',     
    textLight: '#6C757D',    
    accent: '#FFC107',       
    error: '#DC3545',
    toastError: '#DC3545',
    toastSuccess: '#28A745',
    toastText: '#FFFFFF',
    shadow: 'rgba(0, 0, 0, 0.15)',
};

const SHADOW_STYLE = {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5, 
};

// =================================================================
//  Toast Notification
// =================================================================
const Toast = ({ message, isVisible, onDismiss, type = 'error' }) => {
    const fadeAnim = new Animated.Value(0);

    useEffect(() => {
        let timer;
        if (isVisible) {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }).start(() => {
                timer = setTimeout(() => {
                    Animated.timing(fadeAnim, {
                        toValue: 0,
                        duration: 500,
                        easing: Easing.in(Easing.ease),
                        useNativeDriver: true,
                    }).start(onDismiss);
                }, 3000);
            });
        }
        return () => clearTimeout(timer);
    }, [isVisible, fadeAnim, onDismiss]);

    if (!isVisible) return null;

    const backgroundColor = type === 'error' ? COLORS.toastError : COLORS.toastSuccess;

    return (
        <Animated.View style={[styles.toastContainer, { opacity: fadeAnim, backgroundColor }]}>
            <Text style={styles.toastText}>{message}</Text>
        </Animated.View>
    );
};

// =================================================================
//  Content Formatter
// =================================================================
const FormattedContent = ({ content }) => {
    const paragraphs = content.split('\n\n').filter(p => p.trim() !== '');

    const renderLine = (line, key) => {
        const parts = line.split(/(\*\*.*?\*\*)/g).filter(Boolean);

        return (
            <Text key={key} style={styles.contentParagraph}>
                {parts.map((part, i) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                        return (
                            <Text key={i} style={styles.contentBold}>
                                {part.slice(2, -2)}
                            </Text>
                        );
                    }
                    return part;
                })}
            </Text>
        );
    };

    return (
        <View style={styles.contentContainer}>
            {paragraphs.map((paragraph, index) => {
                const lines = paragraph.split('\n').filter(l => l.trim() !== '');
                return lines.map((line, lineIndex) =>
                    renderLine(line, `${index}-${lineIndex}`)
                );
            })}
        </View>
    );
};

// =================================================================
//  Main Screen (Menggunakan useNavigate dari React Router Native)
// =================================================================
export default function EdukasiScreen() {
    const navigate = useNavigate(); 
    const [data, setData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedContent, setSelectedContent] = useState(null);

    const [toastVisible, setToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('error');

    const showToast = (message, type = 'error') => {
        setToastMessage(message);
        setToastType(type);
        setToastVisible(true);
        if (type === 'error') {
            setError(message); 
        }
    };

    const dismissToast = () => {
        setToastVisible(false);
        setToastMessage('');
        setToastType('error');
        if (error) {
            setError(null);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(API_URL);

            if (!response.ok) {
                throw new Error(`Gagal mengambil data: ${response.status}`);
            }

            const json = await response.json();

            if (json.status === 'success' && Array.isArray(json.data)) {
                setData(json.data);
                if (json.data.length === 0) {
                    showToast('Konten edukasi belum tersedia.', 'success');
                }
            } else {
                throw new Error('Format data API tidak sesuai.');
            }
        } catch (e) {
            console.error('API Fetch Error:', e.message);
            showToast('Gagal memuat konten edukasi. Periksa koneksi atau coba lagi nanti.');
        } finally {
            setIsLoading(false);
        }
    };

    // Fungsi kembali ke halaman sebelumnya (MainScreen.js) menggunakan React Router Native
    const handleGoBackToMain = () => {
        navigate(-1); 
    };

    // Detail Screen
    const renderContentDetail = () => {
        if (!selectedContent) return null;

        const { judul_konten, isi_konten } = selectedContent;

        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.detailHeader}>
                    {/* Tombol kembali ke list */}
                    <TouchableOpacity
                        onPress={() => setSelectedContent(null)}
                        style={styles.backButton}
                    >
                        <Icon name="arrow-back-outline" size={24} color={COLORS.primary} />
                    </TouchableOpacity>

                    <Text
                        style={styles.detailTitle}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                    >
                        {judul_konten}
                    </Text>
                </View>

                <ScrollView
                    style={styles.detailScrollView}
                    contentContainerStyle={styles.detailContentPadding}
                >
                    <Text style={styles.sectionHeading}>Informasi Detail</Text>
                    
                    <FormattedContent content={isi_konten} />

                    <View style={styles.footerInfo}>
                        <Icon name="information-circle-outline" size={20} color={COLORS.accent} />
                        <Text style={styles.footerText}>
                            **Penting:** Konten ini disediakan untuk tujuan edukasi dan bukan pengganti saran medis profesional. Selalu konsultasikan masalah kesehatan Anda dengan dokter.
                        </Text>
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    };

    // List Screen
    const renderContentList = () => {
        // --- Loading State ---
        if (isLoading) {
            return (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loadingText}>Memuat Konten...</Text>
                </View>
            );
        }

        // --- Error/Empty State ---
        if (data.length === 0 && error) {
            return (
                <View style={styles.center}>
                    <Icon name="sad-outline" size={60} color={COLORS.error} style={{marginBottom: 10}}/>
                    <Text style={styles.errorTextCenter}>Terjadi kesalahan: {error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
                        <Text style={styles.retryButtonText}>Coba Lagi</Text>
                    </TouchableOpacity>
                    {/* Tombol kembali ke MainScreen */}
                    <TouchableOpacity style={styles.backToMainButton} onPress={handleGoBackToMain}>
                        <Text style={styles.backToMainText}>Kembali ke Menu Utama</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        // --- Main List ---
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.listHeader}>
                    <View style={styles.listHeaderRow}>
                         {/* Tombol kembali ke main screen (Menggunakan navigate(-1)) */}
                        <TouchableOpacity 
                            onPress={handleGoBackToMain}
                            style={styles.mainBackButton}
                        >
                            <Icon name="chevron-back-outline" size={30} color={COLORS.primary} />
                        </TouchableOpacity>
                        <Text style={styles.screenTitle}>Pusat Edukasi Kesehatan 📚</Text>
                    </View>
                    
                    <Text style={styles.screenSubtitle}>
                        Tingkatkan pengetahuan Anda! Pilih topik di bawah ini.
                    </Text>
                </View>

                <ScrollView 
                    style={styles.listScrollView}
                    contentContainerStyle={styles.listContentPadding}
                >
                    {data.length === 0 ? (
                        <View style={styles.centerList}>
                            <Icon name="folder-open-outline" size={50} color={COLORS.textLight} style={{marginBottom: 10}}/>
                            <Text style={styles.emptyText}>Belum ada konten edukasi tersedia saat ini.</Text>
                        </View>
                    ) : (
                        data.map(item => (
                            <TouchableOpacity
                                key={item.id}
                                style={styles.card}
                                onPress={() => setSelectedContent(item)}
                                activeOpacity={0.8}
                            >
                                <View style={styles.cardContent}>
                                    <Icon name="document-text-outline" size={20} color={COLORS.primary} style={styles.cardIcon} />
                                    <Text style={styles.cardTitle}>{item.judul_konten}</Text>
                                </View>
                                
                                <Icon name="chevron-forward" size={24} color={COLORS.secondary} />
                            </TouchableOpacity>
                        ))
                    )}
                    
                    {/* --- FOOTER HAK CIPTA BARU --- */}
                    <View style={styles.copyrightFooter}>
                        <Text style={styles.copyrightText}>© 2025 Ruang Bunda</Text>
                    </View>
                    {/* --- END FOOTER --- */}

                    <View style={{ height: 50 }} /> 
                </ScrollView>

                <Toast
                    message={toastMessage}
                    isVisible={toastVisible}
                    onDismiss={dismissToast}
                    type={toastType}
                />
            </SafeAreaView>
        );
    };

    return selectedContent ? renderContentDetail() : renderContentList();
};

// =================================================================
//  Styles (Diperluas dengan Footer Style)
// =================================================================
const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    centerList: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    loadingText: {
        marginTop: 10,
        color: COLORS.textLight,
        fontSize: 16,
    },
    errorTextCenter: {
        color: COLORS.error,
        marginBottom: 20,
        paddingHorizontal: 20,
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '600',
    },
    emptyText: {
        color: COLORS.textLight,
        fontSize: 16,
        textAlign: 'center',
        padding: 20,
    },
    retryButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 25,
        ...SHADOW_STYLE,
        marginBottom: 10,
    },
    retryButtonText: {
        color: COLORS.card,
        fontWeight: 'bold',
        fontSize: 16,
    },
    backToMainButton: {
        borderColor: COLORS.primary,
        borderWidth: 1,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 25,
        marginTop: 10,
    },
    backToMainText: {
        color: COLORS.primary,
        fontWeight: 'bold',
        fontSize: 16,
    },

    // --- List Header ---
    listHeader: {
        paddingHorizontal: 20,
        paddingBottom: 15,
        paddingTop: Platform.OS === 'android' ? 30 : 10,
        backgroundColor: COLORS.card,
        ...SHADOW_STYLE,
        marginBottom: 10,
    },
    listHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    mainBackButton: {
        marginRight: 10,
        padding: 5,
    },
    screenTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: COLORS.primary,
        flex: 1,
    },
    screenSubtitle: {
        fontSize: 14,
        color: COLORS.textLight,
        marginTop: 5,
        marginLeft: 40, 
    },
    listScrollView: {
        flex: 1,
    },
    listContentPadding: {
        paddingHorizontal: 15,
        paddingBottom: 20,
    },

    // --- Card ---
    card: {
        backgroundColor: COLORS.card,
        padding: 18,
        borderRadius: 12, 
        marginVertical: 6,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        ...SHADOW_STYLE,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        paddingRight: 10,
    },
    cardIcon: {
        marginRight: 15,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.textDark,
        flex: 1,
    },

    // --- Detail Screen ---
    detailHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingBottom: 15,
        paddingTop: Platform.OS === 'android' ? 30 : 10,
        backgroundColor: COLORS.card,
        ...SHADOW_STYLE,
    },
    backButton: {
        padding: 5,
        marginRight: 10,
    },
    detailTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.textDark,
        flex: 1,
    },

    detailScrollView: { flex: 1 },
    detailContentPadding: { padding: 20 },

    sectionHeading: {
        fontSize: 22,
        fontWeight: '800',
        color: COLORS.primary,
        marginBottom: 15,
    },

    contentContainer: { marginBottom: 20 },
    contentParagraph: {
        fontSize: 16,
        color: COLORS.textDark,
        marginBottom: 15, 
        lineHeight: 24, 
        textAlign: 'justify',
    },
    contentBold: {
        fontWeight: 'bold',
        color: COLORS.primary,
    },

    footerInfo: {
        marginTop: 30,
        borderTopWidth: 1,
        borderTopColor: '#E9ECEF',
        paddingTop: 15,
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    footerText: {
        marginLeft: 10,
        fontSize: 13,
        color: COLORS.textLight,
        fontStyle: 'italic',
        flex: 1,
    },
    
    // --- Footer Hak Cipta BARU ---
    copyrightFooter: {
        paddingVertical: 20,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        marginTop: 20,
    },
    copyrightText: {
        fontSize: 12,
        color: COLORS.textLight,
        fontWeight: '400',
    },

    // --- Toast ---
    toastContainer: {
        position: 'absolute',
        bottom: 50,
        alignSelf: 'center',
        padding: 15,
        borderRadius: 10,
        maxWidth: width - 40,
        zIndex: 1000,
    },
    toastText: {
        color: COLORS.toastText,
        textAlign: 'center',
        fontWeight: '600',
    },
});