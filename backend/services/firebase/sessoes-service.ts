
import {
    onValue,
    push,
    ref,
    runTransaction,
    set,
} from "firebase/database";

import { auth, realtimeDb } from "../firebase";

export type SessaoMedicao = {
    sessaoId: string;
    uid: string;
    pontoId: string;
    pontoNome: string;
    area: string;
    status: "ativa" | "concluida" | "Disponivel";
    dataHoraInicio: string;
    dataHoraFim?: string;
};

// Inicia uma sessão de medição
export async function iniciarSessao(
    pontoId: string,
    pontoNome: string,
    area: string,
): Promise<SessaoMedicao> {
    const usuario = auth.currentUser;

    if (!usuario) {
        throw new Error("Nenhum produtor está conectado.");
    }

    if (!pontoId || !area) {
        throw new Error("Ponto e área precisam ser informados.");
    }

    const uid = usuario.uid;

    const referenciaSessoes = ref(
        realtimeDb,
        `usuarios/${uid}/sessoes`,
    );

    const sessaoId = push(referenciaSessoes).key;

    if (!sessaoId) {
        throw new Error("Não foi possível gerar o ID da sessão.");
    }

    const sessao: SessaoMedicao = {
        sessaoId,
        uid,
        pontoId,
        pontoNome,
        area,
        status: "ativa",
        dataHoraInicio: new Date().toISOString(),
    };

    const referenciaControle = ref(
        realtimeDb,
        "controle/sessaoAtiva",
    );

    // Reserva o equipamento globalmente.
    const resultado = await runTransaction(
        referenciaControle,
        (sessaoAtual) => {
            // Bloqueia somente se já existir uma medição ativa.
            if (sessaoAtual?.status === "ativa") {
                return;
            }

            // Permite iniciar se estiver Disponivel,
            // concluída ou sem registro.
            return sessao;
        },
    );

    if (!resultado.committed) {
        throw new Error(
            "O equipamento já está sendo utilizado em outra medição.",
        );
    }

    try {
        await set(
            ref(realtimeDb, `usuarios/${uid}/sessoes/${sessaoId}`),
            sessao,
        );

        return sessao;
    } catch (erro) {
        // Libera o controle caso não consiga registrar no perfil.
        await runTransaction(referenciaControle, (sessaoAtual) => {
            if (sessaoAtual?.sessaoId === sessaoId) {
                return null;
            }

            return;
        });

        throw erro;
    }
}

// Conclui uma sessão de medição
export async function concluirSessao(sessaoId: string): Promise<void> {
    const usuario = auth.currentUser;

    if (!usuario) {
        throw new Error("Nenhum produtor está conectado.");
    }

    const referenciaControle = ref(
        realtimeDb,
        "controle/sessaoAtiva",
    );

    const resultado = await runTransaction(
        referenciaControle,
        (sessaoAtual) => {
            if (
                sessaoAtual?.sessaoId === sessaoId &&
                sessaoAtual?.uid === usuario.uid
            ) {
                return null;
            }

            return;
        },
    );

    if (!resultado.committed) {
        throw new Error("Não foi possível liberar o equipamento.");
    }

    await set(
        ref(
            realtimeDb,
            `usuarios/${usuario.uid}/sessoes/${sessaoId}/status`,
        ),
        "concluida",
    );

    await set(
        ref(
            realtimeDb,
            `usuarios/${usuario.uid}/sessoes/${sessaoId}/dataHoraFim`,
        ),
        new Date().toISOString(),
    );
}

// Observa em tempo real o estado do equipamento
export function observarSessaoAtiva(
    aoAtualizar: (sessao: SessaoMedicao | null) => void,
    aoErro?: (erro: Error) => void,
) {
    const referenciaControle = ref(
        realtimeDb,
        "controle/sessaoAtiva",
    );

    return onValue(
        referenciaControle,
        (snapshot) => {
            const dados = snapshot.val() as SessaoMedicao | null;

            if (!dados || dados.status !== "ativa") {
                aoAtualizar(null);
                return;
            }

            aoAtualizar(dados);
        },
        (erro) => {
            console.error("Erro ao observar equipamento:", erro);
            aoErro?.(erro);
        },
    );
}

// Estado de conexão do equipamento
export type EstadoEquipamento = {
    conectado: boolean;
    ultimaComunicacao: number;
};

// Observa a conexão do equipamento em tempo real
export function observarEquipamento(
    aoAtualizar: (estado: EstadoEquipamento) => void,
    aoErro?: (erro: Error) => void,
) {
    const referenciaEquipamento = ref(
        realtimeDb,
        "controle/equipamento",
    );

    return onValue(
        referenciaEquipamento,
        (snapshot) => {
            const dados = snapshot.val();

            if (dados) {
                aoAtualizar({
                    conectado: dados.conectado === true,
                    ultimaComunicacao: dados.ultimaComunicacao ?? 0,
                });
            } else {
                aoAtualizar({
                    conectado: false,
                    ultimaComunicacao: 0,
                });
            }
        },
        (erro) => {
            console.error("Erro ao observar conexão:", erro);
            aoErro?.(erro);
        },
    );
}

