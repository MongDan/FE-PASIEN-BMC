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
    Easing,
    RefreshControl
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

// URL API yang disediakan
const API_URL = 'https://restful-api-bmc-production.up.railway.app/api/konten-edukasi';

// Pewarnaan

const COLORS = {
   
    primaryBlue: '#2196F3', 
    darkBlue: '#1976D2', 
    lightBlue: '#E3F2FD', 
    white: '#FFFFFF', 
    offWhite: '#F8F9FA', 
    textPrimary: '#263238', 
    textSecondary: '#607D8B', 
    accentSuccess: '#4CAF50', 
    accentError: '#F44336', 
    shadow: 'rgba(0, 0, 0, 0.08)', 
    border: '#E0E0E0', 
};

const SHADOW_STYLE = {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2, 
    shadowRadius: 6,
    elevation: 6,
};


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

    const backgroundColor = type === 'error' ? COLORS.accentError : COLORS.accentSuccess;

    return (
        <Animated.View style={[styles.toastContainer, { opacity: fadeAnim, backgroundColor }]}>
            <Text style={styles.toastText}>{message}</Text>
        </Animated.View>
    );
};


const FormattedContent = ({ content }) => {
    const paragraphs = content.split('\n\n').filter(p => p.trim() !== '');

    const renderLine = (line, key) => {
        const trimmedLine = line.trim();
        const parts = trimmedLine.split(/(\*\*.*?\*\*)/g).filter(Boolean);

        if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
            return (
                <View key={key} style={styles.listItem}>
                    <Icon name="ellipse" size={5} color={COLORS.primaryBlue} style={styles.listBullet} />
                    <Text style={styles.contentListItem}>
                        {parts.map((part, i) => {
                            if (part.startsWith('**') && part.endsWith('**')) {
                                return (
                                    <Text key={i} style={styles.contentBold}>
                                        {part.slice(2, -2)}
                                    </Text>
                                );
                            }
                            
                            const textPart = i === 0 && (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* '))
                                ? part.substring(2)
                                : part;
                            return textPart;
                        })}
                    </Text>
                </View>
            );
        }

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


export default function EdukasiScreen() {
    const navigate = useNavigate();
    const [data, setData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
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
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async (isManualRefresh = false) => {
        try {
            if (isManualRefresh) {
                setIsRefreshing(true);
            } else {
                setIsLoading(true);
            }
            setError(null);

            const response = await fetch(API_URL);

            if (!response.ok) {
                throw new Error(`Gagal mengambil data: ${response.status}`);
            }

            const json = await response.json();

            if (json.status === 'success' && Array.isArray(json.data)) {
                setData(json.data);
                if (json.data.length === 0 && !isManualRefresh) {
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
            setIsRefreshing(false);
        }
    };

    const handleRefresh = () => {
        fetchData(true);
    };

    const handleGoBackToMain = () => {
        navigate(-1);
    };

    const renderContentDetail = () => {
        if (!selectedContent) return null;

        const { judul_konten, isi_konten, kategori } = selectedContent;

        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.detailHeader}>
                    <TouchableOpacity
                        onPress={() => setSelectedContent(null)}
                        style={styles.backButton}
                    >
                        <Icon name="arrow-back-outline" size={28} color={COLORS.primaryBlue} />
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
                    <View style={styles.categoryLabel}>
                        <Icon name="bookmark-outline" size={14} color={COLORS.white} />
                        <Text style={styles.categoryText}>{kategori || "Umum"}</Text>
                    </View>
                    <View style={styles.separator} />

                    <Text style={styles.sectionHeading}>Isi Konten</Text>

                    <FormattedContent content={isi_konten} />

                    <View style={styles.footerInfo}>
                        <Icon name="information-circle-outline" size={24} color={COLORS.darkBlue} style={{ marginTop: 3 }} />
                        <Text style={styles.footerText}>
                            **Penting untuk Bunda:** Konten ini bersifat edukasi umum dan **bukan pengganti** nasihat medis profesional. Selalu konsultasikan masalah kesehatan atau kehamilan Anda dengan **dokter atau bidan** terpercaya.
                        </Text>
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    };

    const renderContentList = () => {
        if (isLoading && !isRefreshing) {
            return (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={COLORS.primaryBlue} />
                    <Text style={styles.loadingText}>Memuat Konten Kesehatan Bunda...</Text>
                </View>
            );
        }

        if (data.length === 0 && error) {
            return (
                <View style={styles.center}>
                    <Icon name="cloud-offline-outline" size={70} color={COLORS.accentError} style={{ marginBottom: 15 }} />
                    <Text style={styles.errorTextCenter}>Gagal memuat data!</Text>
                    <Text style={styles.errorTextDetail}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
                        <Text style={styles.retryButtonText}>Coba Lagi</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.backToMainButton} onPress={handleGoBackToMain}>
                        <Text style={styles.backToMainText}>Kembali ke Menu Utama</Text>
                    </TouchableOpacity>
                    <Toast
                        message={toastMessage}
                        isVisible={toastVisible}
                        onDismiss={dismissToast}
                        type={toastType}
                    />
                </View>
            );
        }

        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.listHeader}>
                    <View style={styles.listHeaderRow}>
                        <TouchableOpacity
                            onPress={handleGoBackToMain}
                            style={styles.mainBackButton}
                        >
                            <Icon name="chevron-back-outline" size={30} color={COLORS.primaryBlue} />
                        </TouchableOpacity>
                        <Text style={styles.screenTitle}>Edukasi Bunda 💙</Text>
                    </View>

                    <Text style={styles.screenSubtitle}>
                        Tingkatkan pengetahuan kesehatan kehamilan para Bunda.
                    </Text>
                </View>

                <ScrollView
                    style={styles.listScrollView}
                    contentContainerStyle={styles.listContentPadding}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={handleRefresh}
                            tintColor={COLORS.primaryBlue}
                        />
                    }
                >
                    {data.length === 0 ? (
                        <View style={styles.centerList}>
                            <Icon name="information-circle-outline" size={60} color={COLORS.textSecondary} style={{ marginBottom: 15 }} />
                            <Text style={styles.emptyText}>Belum ada konten edukasi tersedia saat ini. Silakan tarik ke bawah untuk memuat ulang.</Text>
                        </View>
                    ) : (
                        data.map(item => (
                            <TouchableOpacity
                                key={item.id}
                                style={styles.card}
                                onPress={() => setSelectedContent(item)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.cardIconCircle}>
                                    <Icon name="document-text-outline" size={24} color={COLORS.primaryBlue} />
                                </View>
                                <View style={styles.cardContent}>
                                    <Text style={styles.cardTitle}>{item.judul_konten}</Text>
                                    <Text style={styles.cardSubtitle}>Baca selengkapnya...</Text>
                                </View>

                                <Icon name="chevron-forward" size={24} color={COLORS.textSecondary} />
                            </TouchableOpacity>
                        ))
                    )}

                    <View style={styles.copyrightFooter}>
                        <Text style={styles.copyrightText}>© 2025 Ruang Bunda</Text>
                    </View>

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
}


const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.offWhite, 
    },

    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: COLORS.offWhite,
    },
    centerList: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 20,
    },
    loadingText: {
        marginTop: 15,
        color: COLORS.textSecondary,
        fontSize: 18,
        fontWeight: '500',
    },
    errorTextCenter: {
        color: COLORS.accentError,
        marginBottom: 5,
        paddingHorizontal: 20,
        textAlign: 'center',
        fontSize: 20,
        fontWeight: 'bold',
    },
    errorTextDetail: {
        color: COLORS.textSecondary,
        marginBottom: 20,
        paddingHorizontal: 20,
        textAlign: 'center',
        fontSize: 14,
    },
    emptyText: {
        color: COLORS.textSecondary,
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
    },
    retryButton: {
        backgroundColor: COLORS.primaryBlue,
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 30,
        ...SHADOW_STYLE,
        marginBottom: 10,
    },
    retryButtonText: {
        color: COLORS.white,
        fontWeight: 'bold',
        fontSize: 16,
    },
    backToMainButton: {
        borderColor: COLORS.primaryBlue,
        borderWidth: 1,
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 30,
        marginTop: 10,
    },
    backToMainText: {
        color: COLORS.primaryBlue,
        fontWeight: 'bold',
        fontSize: 16,
    },

    // --- List Header ---
    listHeader: {
        paddingHorizontal: 20,
        paddingBottom: 20,
        paddingTop: Platform.OS === 'android' ? 30 : 10,
        backgroundColor: COLORS.white,
        ...SHADOW_STYLE,
        marginBottom: 15,
        borderBottomLeftRadius: 15, 
        borderBottomRightRadius: 15,
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
        fontSize: 26,
        fontWeight: '800',
        color: COLORS.darkBlue, 
        flex: 1,
    },
    screenSubtitle: {
        fontSize: 16,
        color: COLORS.textSecondary,
        marginTop: 8,
        marginLeft: 45,
    },
    listScrollView: {
        flex: 1,
    },
    listContentPadding: {
        paddingHorizontal: 15,
        paddingBottom: 20,
    },


    card: {
        backgroundColor: COLORS.white,
        padding: 18,
        borderRadius: 12, 
        marginVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
        ...SHADOW_STYLE,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.primaryBlue,
    },
    cardIconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.lightBlue, 
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    cardContent: {
        flex: 1,
        paddingRight: 10,
    },
    cardTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: COLORS.textPrimary,
        marginBottom: 3,
    },
    cardSubtitle: {
        fontSize: 13,
        color: COLORS.textSecondary,
        fontWeight: '400',
    },

    detailHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingBottom: 15,
        paddingTop: Platform.OS === 'android' ? 30 : 10,
        backgroundColor: COLORS.white,
        ...SHADOW_STYLE,
        borderBottomLeftRadius: 15,
        borderBottomRightRadius: 15,
    },
    backButton: {
        padding: 5,
        marginRight: 10,
    },
    detailTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        flex: 1,
    },
    detailScrollView: { flex: 1 },
    detailContentPadding: { padding: 20 },

    categoryLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primaryBlue,
        paddingHorizontal: 12, 
        paddingVertical: 6, 
        borderRadius: 20, 
        alignSelf: 'flex-start',
        marginBottom: 15,
        ...SHADOW_STYLE, 
    },
    categoryText: {
        marginLeft: 8, 
        color: COLORS.white,
        fontSize: 14, 
        fontWeight: '600',
    },
    separator: {
        height: 1,
        backgroundColor: COLORS.border, 
        marginBottom: 20,
        marginTop: 5, 
    },
    sectionHeading: {
        fontSize: 24,
        fontWeight: '800',
        color: COLORS.darkBlue, 
        marginBottom: 15,
    },
    contentContainer: { marginBottom: 20 },
    contentParagraph: {
        fontSize: 16,
        color: COLORS.textPrimary,
        marginBottom: 15,
        lineHeight: 25, 
        textAlign: 'justify',
    },
    contentBold: {
        fontWeight: 'bold',
        color: COLORS.darkBlue,
    },


    listItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 10,
        paddingLeft: 5,
    },
    listBullet: {
        marginTop: 8,
        marginRight: 10,
    },
    contentListItem: {
        flex: 1,
        fontSize: 16,
        color: COLORS.textPrimary,
        lineHeight: 25,
        textAlign: 'justify',
    },


    footerInfo: {
        marginTop: 30,
        padding: 18, 
        backgroundColor: COLORS.lightBlue, 
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'flex-start',
        borderLeftWidth: 5, 
        borderLeftColor: COLORS.darkBlue, 
        ...SHADOW_STYLE,
    },
    footerText: {
        marginLeft: 10,
        fontSize: 14,
        color: COLORS.textPrimary,
        fontStyle: 'italic',
        flex: 1,
        lineHeight: 22,
    },

    copyrightFooter: {
        paddingVertical: 20,
        alignItems: 'center',
        marginTop: 20,
    },
    copyrightText: {
        fontSize: 13,
        color: COLORS.textSecondary,
        fontWeight: '400',
        textAlign: 'center',
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
        color: COLORS.white,
        textAlign: 'center',
        fontWeight: '600',
    },
});