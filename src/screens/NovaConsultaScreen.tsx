import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Alert,
    Modal,
    FlatList,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useAuth } from "../contexts/AuthContext";
// import { criarConsulta } from "../services/consultasService";

type NovaConsultaScreenProps = {
    navigation: any;
};

type Especialidade = "Cardiologia" | "Dermatologia" | "Ortopedia" | "Pediatria" | "Psiquiatria" | "Clínica Geral";

interface Medico {
    id: number;
    nome: string;
    especialidade: Especialidade;
}

const ESPECIALIDADES: Especialidade[] = [
    "Cardiologia",
    "Dermatologia",
    "Ortopedia",
    "Pediatria",
    "Psiquiatria",
    "Clínica Geral",
];

const MEDICOS: Medico[] = [
    { id: 1, nome: "Dr. Carlos Silva", especialidade: "Cardiologia" },
    { id: 2, nome: "Dra. Ana Costa", especialidade: "Dermatologia" },
    { id: 3, nome: "Dr. João Santos", especialidade: "Ortopedia" },
    { id: 4, nome: "Dra. Maria Oliveira", especialidade: "Pediatria" },
    { id: 5, nome: "Dr. Pedro Lima", especialidade: "Psiquiatria" },
    { id: 6, nome: "Dra. Beatriz Souza", especialidade: "Clínica Geral" },
];

const HORARIOS_DISPONIVEIS = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
    "11:00", "11:30", "14:00", "14:30", "15:00", "15:30", "16:00",
];

function aplicarMascaraData(valor: string): string {
    const numeros = valor.replace(/\D/g, "").slice(0, 8);
    if (numeros.length <= 2) return numeros;
    if (numeros.length <= 4) return `${numeros.slice(0, 2)}/${numeros.slice(2)}`;
    return `${numeros.slice(0, 2)}/${numeros.slice(2, 4)}/${numeros.slice(4)}`;
}

export default function NovaConsultaScreen({ navigation }: NovaConsultaScreenProps) {
    const { usuario } = useAuth();
    const [especialidade, setEspecialidade] = useState<Especialidade | null>(null);
    const [medico, setMedico] = useState<Medico | null>(null);
    const [data, setData] = useState("");
    const [horario, setHorario] = useState("");
    const [observacoes, setObservacoes] = useState("");
    const [loading, setLoading] = useState(false);

    const [modalEspecialidade, setModalEspecialidade] = useState(false);
    const [modalMedico, setModalMedico] = useState(false);
    const [modalHorario, setModalHorario] = useState(false);

    const medicosFiltrados = especialidade
        ? MEDICOS.filter((m) => m.especialidade === especialidade)
        : MEDICOS;

    function selecionarEspecialidade(esp: Especialidade) {
        setEspecialidade(esp);
        setMedico(null); // Limpa médico ao trocar especialidade
        setModalEspecialidade(false);
    }

    function selecionarMedico(med: Medico) {
        setMedico(med);
        setModalMedico(false);
    }

    function selecionarHorario(hora: string) {
        setHorario(hora);
        setModalHorario(false);
    }

    async function handleAgendar() {
        if (!especialidade || !medico || !data || !horario) {
            Alert.alert("Erro", "Preencha todos os campos obrigatórios");
            return;
        }

        const digitosData = data.replace(/\D/g, "");
        if (digitosData.length !== 8) {
            Alert.alert("Erro", "Data inválida. Use o formato DD/MM/AAAA");
            return;
        }

        const [dia, mes, ano] = data.split("/");
        const dataISO = `${ano}-${mes}-${dia}`;

        setLoading(true);
        try {
            await criarConsulta({
                pacienteId: usuario!.id,
                medicoNome: medico.nome,
                especialidade: especialidade,
                data: dataISO,
                horario: horario,
                observacoes: observacoes.trim(),
                status: "agendada",
            });

            Alert.alert("Sucesso!", "Consulta agendada com sucesso!", [
                {
                    text: "OK",
                    onPress: () => navigation.goBack(),
                },
            ]);
        } catch (error: any) {
            Alert.alert("Erro", error.message || "Não foi possível agendar a consulta");
        } finally {
            setLoading(false);
        }
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
            <StatusBar style="light" />
            <View style={styles.content}>
                <Text style={styles.titulo}>Nova Consulta</Text>
                <Text style={styles.subtitulo}>Agende sua consulta médica</Text>

                <View style={styles.formContainer}>
                    <TouchableOpacity
                        style={styles.selector}
                        onPress={() => setModalEspecialidade(true)}
                    >
                        <Text style={styles.selectorLabel}>Especialidade *</Text>
                        <Text style={styles.selectorValue}>
                            {especialidade || "Selecione..."}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.selector}
                        onPress={() => setModalMedico(true)}
                        disabled={!especialidade}
                    >
                        <Text style={styles.selectorLabel}>Médico *</Text>
                        <Text style={[styles.selectorValue, !especialidade && styles.selectorDisabled]}>
                            {medico ? medico.nome : "Selecione..."}
                        </Text>
                    </TouchableOpacity>

                    <View>
                        <Text style={styles.label}>Data *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="DD/MM/AAAA"
                            placeholderTextColor="#999"
                            value={data}
                            onChangeText={(texto) => setData(aplicarMascaraData(texto))}
                            keyboardType="numeric"
                            maxLength={10}
                            editable={!loading}
                        />
                    </View>

                    <TouchableOpacity
                        style={styles.selector}
                        onPress={() => setModalHorario(true)}
                    >
                        <Text style={styles.selectorLabel}>Horário *</Text>
                        <Text style={styles.selectorValue}>
                            {horario || "Selecione..."}
                        </Text>
                    </TouchableOpacity>

                    <View>
                        <Text style={styles.label}>Observações</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Informações adicionais (opcional)"
                            placeholderTextColor="#999"
                            value={observacoes}
                            onChangeText={setObservacoes}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                            editable={!loading}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.botao, styles.botaoPrimario]}
                        onPress={handleAgendar}
                        disabled={loading}
                    >
                        <Text style={styles.botaoTexto}>
                            {loading ? "Agendando..." : "Agendar Consulta"}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.botao, styles.botaoSecundario]}
                        onPress={() => navigation.goBack()}
                        disabled={loading}
                    >
                        <Text style={styles.botaoTextoSecundario}>Cancelar</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Modal Especialidade */}
            <Modal
                visible={modalEspecialidade}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setModalEspecialidade(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitulo}>Escolha a Especialidade</Text>
                        {ESPECIALIDADES.map((esp) => (
                            <TouchableOpacity
                                key={esp}
                                style={styles.modalItem}
                                onPress={() => selecionarEspecialidade(esp)}
                            >
                                <Text style={styles.modalItemTexto}>{esp}</Text>
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity
                            style={styles.modalBotaoFechar}
                            onPress={() => setModalEspecialidade(false)}
                        >
                            <Text style={styles.modalBotaoTexto}>Fechar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Modal Médico */}
            <Modal
                visible={modalMedico}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setModalMedico(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitulo}>Escolha o Médico</Text>
                        {medicosFiltrados.map((med) => (
                            <TouchableOpacity
                                key={med.id}
                                style={styles.modalItem}
                                onPress={() => selecionarMedico(med)}
                            >
                                <Text style={styles.modalItemTexto}>{med.nome}</Text>
                                <Text style={styles.modalItemSubtexto}>{med.especialidade}</Text>
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity
                            style={styles.modalBotaoFechar}
                            onPress={() => setModalMedico(false)}
                        >
                            <Text style={styles.modalBotaoTexto}>Fechar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Modal Horário */}
            <Modal
                visible={modalHorario}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setModalHorario(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitulo}>Escolha o Horário</Text>
                        <FlatList
                            data={HORARIOS_DISPONIVEIS}
                            keyExtractor={(item) => item}
                            numColumns={3}
                            columnWrapperStyle={styles.horarioGrid}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.horarioItem}
                                    onPress={() => selecionarHorario(item)}
                                >
                                    <Text style={styles.horarioTexto}>{item}</Text>
                                </TouchableOpacity>
                            )}
                        />
                        <TouchableOpacity
                            style={styles.modalBotaoFechar}
                            onPress={() => setModalHorario(false)}
                        >
                            <Text style={styles.modalBotaoTexto}>Fechar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#79059C",
    },
    scrollContent: {
        flexGrow: 1,
    },
    content: {
        flex: 1,
        padding: 24,
        paddingTop: 60,
    },
    titulo: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#fff",
        marginBottom: 8,
    },
    subtitulo: {
        fontSize: 16,
        color: "#fff",
        opacity: 0.9,
        marginBottom: 32,
    },
    formContainer: {
        gap: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        color: "#fff",
        marginBottom: 8,
    },
    input: {
        backgroundColor: "#fff",
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 12,
        fontSize: 16,
        color: "#333",
    },
    textArea: {
        height: 100,
        paddingTop: 16,
    },
    selector: {
        backgroundColor: "#fff",
        padding: 16,
        borderRadius: 12,
    },
    selectorLabel: {
        fontSize: 12,
        color: "#666",
        marginBottom: 4,
    },
    selectorValue: {
        fontSize: 16,
        color: "#333",
        fontWeight: "500",
    },
    selectorDisabled: {
        color: "#999",
    },
    botao: {
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 12,
        alignItems: "center",
        marginTop: 8,
    },
    botaoPrimario: {
        backgroundColor: "#fff",
    },
    botaoSecundario: {
        backgroundColor: "transparent",
        borderWidth: 2,
        borderColor: "#fff",
    },
    botaoTexto: {
        color: "#79059C",
        fontWeight: "bold",
        fontSize: 16,
    },
    botaoTextoSecundario: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 16,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "flex-end",
    },
    modalContent: {
        backgroundColor: "#fff",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 24,
        maxHeight: "80%",
    },
    modalTitulo: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#333",
        marginBottom: 20,
        textAlign: "center",
    },
    modalItem: {
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
    },
    modalItemTexto: {
        fontSize: 16,
        color: "#333",
        fontWeight: "500",
    },
    modalItemSubtexto: {
        fontSize: 14,
        color: "#666",
        marginTop: 4,
    },
    modalBotaoFechar: {
        marginTop: 20,
        paddingVertical: 14,
        backgroundColor: "#f0f0f0",
        borderRadius: 12,
        alignItems: "center",
    },
    modalBotaoTexto: {
        fontSize: 16,
        color: "#666",
        fontWeight: "600",
    },
    horarioGrid: {
        justifyContent: "space-between",
        marginBottom: 12,
    },
    horarioItem: {
        backgroundColor: "#79059C",
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        flex: 0.3,
        alignItems: "center",
    },
    horarioTexto: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
});
function criarConsulta(arg0: { pacienteId: number; medicoNome: string; especialidade: Especialidade; data: string; horario: string; observacoes: string; status: string; }) {
    throw new Error("Function not implemented.");
}

