/**
 * Cadastro de Paciente
 * Permite criar uma nova conta de paciente
 */

import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Alert,
    ActivityIndicator,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useAuth } from "../contexts/AuthContext";
import { cadastrarUsuario } from "../services/authService";

type CadastroPacienteProps = {
    navigation: any;
};

// ─── Funções de máscara ───────────────────────────────────────────────────────

function aplicarMascaraCPF(valor: string): string {
    const numeros = valor.replace(/\D/g, "").slice(0, 11);
    if (numeros.length <= 3) return numeros;
    if (numeros.length <= 6) return `${numeros.slice(0, 3)}.${numeros.slice(3)}`;
    if (numeros.length <= 9)
        return `${numeros.slice(0, 3)}.${numeros.slice(3, 6)}.${numeros.slice(6)}`;
    return `${numeros.slice(0, 3)}.${numeros.slice(3, 6)}.${numeros.slice(6, 9)}-${numeros.slice(9)}`;
}

function aplicarMascaraTelefone(valor: string): string {
    const numeros = valor.replace(/\D/g, "").slice(0, 11);
    if (numeros.length === 0) return "";
    if (numeros.length <= 2) return `(${numeros}`;
    if (numeros.length <= 7)
        return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
}

// ─── Validação de CPF ─────────────────────────────────────────────────────────
/**
 * Valida CPF usando o algoritmo oficial da Receita Federal
 */
function validarCPF(cpf: string): boolean {
    const numeros = cpf.replace(/\D/g, "");

    if (numeros.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(numeros)) return false;

    let soma = 0;
    for (let i = 0; i < 9; i++) {
        soma += parseInt(numeros.charAt(i)) * (10 - i);
    }
    let resto = (soma * 10) % 11;
    const digito1 = resto === 10 ? 0 : resto;

    if (digito1 !== parseInt(numeros.charAt(9))) return false;

    soma = 0;
    for (let i = 0; i < 10; i++) {
        soma += parseInt(numeros.charAt(i)) * (11 - i);
    }
    resto = (soma * 10) % 11;
    const digito2 = resto === 10 ? 0 : resto;

    if (digito2 !== parseInt(numeros.charAt(10))) return false;

    return true;
}

// ─── Validação de Email ───────────────────────────────────────────────────────
function validarEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email.trim());
}

// ─────────────────────────────────────────────────────────────────────────────

export default function CadastroPaciente({ navigation }: CadastroPacienteProps) {
    const { login } = useAuth();
    const [nome, setNome] = useState("");
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [cpf, setCpf] = useState("");
    const [telefone, setTelefone] = useState("");
    const [loading, setLoading] = useState(false);

    const [erroCpf, setErroCpf] = useState("");
    const [erroEmail, setErroEmail] = useState("");

    async function handleCadastro() {
        if (!nome.trim() || !email.trim() || !senha.trim() || !cpf.trim() || !telefone.trim()) {
            Alert.alert("Erro", "Preencha todos os campos");
            return;
        }

        if (senha.length < 6) {
            Alert.alert("Erro", "A senha deve ter no mínimo 6 caracteres");
            return;
        }

        if (!validarCPF(cpf)) {
            Alert.alert(
                "CPF Inválido",
                "O CPF informado não é válido.\n\nPara testar, gere um CPF válido em:\nhttps://www.4devs.com.br/gerador_de_cpf"
            );
            return;
        }

        const digitosTel = telefone.replace(/\D/g, "");
        if (digitosTel.length < 10 || digitosTel.length > 11) {
            Alert.alert("Erro", "Telefone inválido. Informe DDD + número.");
            return;
        }

        setLoading(true);
        try {
            const novoUsuario = await cadastrarUsuario({
                nome: nome.trim(),
                email: email.trim().toLowerCase(),
                senha: senha,
                cpf: cpf.trim(),
                telefone: telefone.trim(),
            });

            if (!novoUsuario) {
                Alert.alert("Erro", "Não foi possível criar a conta. Verifique se o email já está cadastrado.");
                setLoading(false);
                return;
            }

            const loginSucesso = await login(email.trim().toLowerCase(), senha);

            if (loginSucesso) {
                Alert.alert(
                    "Sucesso!",
                    `Bem-vindo(a), ${nome}! Sua conta foi criada com sucesso.`,
                    [{ text: "OK" }]
                );
            } else {
                Alert.alert("Aviso", "Conta criada! Faça login para continuar.");
                navigation.goBack();
            }
        } catch (error: any) {
            Alert.alert("Erro", error.message || "Ocorreu um erro ao criar a conta");
        } finally {
            setLoading(false);
        }
    }

    function validarCampoCpf() {
        if (cpf.trim() === "") {
            setErroCpf("");
            return;
        }

        if (!validarCPF(cpf)) {
            setErroCpf("CPF inválido. Use https://www.4devs.com.br/gerador_de_cpf para gerar um válido.");
        } else {
            setErroCpf("");
        }
    }

    function validarCampoEmail() {
        if (email.trim() === "") {
            setErroEmail("");
            return;
        }

        if (!validarEmail(email)) {
            setErroEmail("Email inválido. Use o formato: exemplo@dominio.com");
        } else {
            setErroEmail("");
        }
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
            <StatusBar style="light" />
            <View style={styles.content}>
                <Text style={styles.icone}>📝</Text>
                <Text style={styles.titulo}>Criar Conta</Text>
                <Text style={styles.subtitulo}>Cadastre-se como paciente</Text>

                <View style={styles.formContainer}>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={styles.input}
                            placeholder="Nome completo"
                            placeholderTextColor="#999"
                            value={nome}
                            onChangeText={setNome}
                            editable={!loading}
                        />
                    </View>

                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={[styles.input, erroEmail ? styles.inputErro : null]}
                            placeholder="Email"
                            placeholderTextColor="#999"
                            value={email}
                            onChangeText={(texto) => {
                                setEmail(texto);
                                if (erroEmail) setErroEmail("");
                            }}
                            onBlur={validarCampoEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            editable={!loading}
                        />
                        {erroEmail ? <Text style={styles.textoErro}>{erroEmail}</Text> : null}
                    </View>

                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={styles.input}
                            placeholder="Senha (mínimo 6 caracteres)"
                            placeholderTextColor="#999"
                            value={senha}
                            onChangeText={setSenha}
                            secureTextEntry
                            editable={!loading}
                        />
                    </View>

                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={[styles.input, erroCpf ? styles.inputErro : null]}
                            placeholder="CPF (000.000.000-00)"
                            placeholderTextColor="#999"
                            value={cpf}
                            onChangeText={(texto) => {
                                setCpf(aplicarMascaraCPF(texto));
                                if (erroCpf) setErroCpf("");
                            }}
                            onBlur={validarCampoCpf}
                            keyboardType="numeric"
                            maxLength={14}
                            editable={!loading}
                        />
                        {erroCpf ? <Text style={styles.textoErro}>{erroCpf}</Text> : null}
                    </View>

                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={styles.input}
                            placeholder="Telefone (11) 99999-9999"
                            placeholderTextColor="#999"
                            value={telefone}
                            onChangeText={(texto) => setTelefone(aplicarMascaraTelefone(texto))}
                            keyboardType="phone-pad"
                            maxLength={16}
                            editable={!loading}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.botao, styles.botaoPrimario]}
                        onPress={handleCadastro}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.botaoTexto}>Criar Conta</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.botao, styles.botaoSecundario]}
                        onPress={() => navigation.goBack()}
                        disabled={loading}
                    >
                        <Text style={styles.botaoTextoSecundario}>Voltar ao Login</Text>
                    </TouchableOpacity>
                </View>
            </View>
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
        justifyContent: "center",
        alignItems: "center",
        padding: 32,
        paddingTop: 60,
        paddingBottom: 40,
    },
    icone: {
        fontSize: 80,
        marginBottom: 24,
    },
    titulo: {
        fontSize: 32,
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
        width: "100%",
        gap: 16,
    },
    inputWrapper: {
        width: "100%",
    },
    input: {
        backgroundColor: "#fff",
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 12,
        fontSize: 16,
        color: "#333",
    },
    inputErro: {
        borderWidth: 2,
        borderColor: "#ff6b6b",
    },
    textoErro: {
        color: "#ffcccc",
        fontSize: 12,
        marginTop: 6,
        marginLeft: 4,
        lineHeight: 16,
    },
    botao: {
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 12,
        alignItems: "center",
    },
    botaoPrimario: {
        backgroundColor: "#fff",
        marginTop: 8,
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
});
