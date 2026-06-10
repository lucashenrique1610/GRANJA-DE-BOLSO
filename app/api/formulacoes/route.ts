import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getUserFromRequest } from "@/lib/auth-helper"

export async function GET(req: Request) {
    try {
        const user = await getUserFromRequest(req)
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Get formulacoes with their items
        const { data: formulacoes, error: errorFormulacoes } = await supabaseAdmin
            .from("formulacoes")
            .select("*")
            .eq("user_id", user.id)

        if (errorFormulacoes) {
            return NextResponse.json({ error: errorFormulacoes.message }, { status: 500 })
        }

        // Get all items for these formulacoes
        const formulacaoIds = formulacoes.map(f => f.id)
        const { data: itens, error: errorItens } = await supabaseAdmin
            .from("itens_formulacao")
            .select("*")
            .in("formulacao_id", formulacaoIds)

        if (errorItens) {
            return NextResponse.json({ error: errorItens.message }, { status: 500 })
        }

        // Combine formulacoes with their items
        const formulacoesComItens = formulacoes.map(formulacao => ({
            ...formulacao,
            itens: itens.filter(item => item.formulacao_id === formulacao.id)
        }))

        return NextResponse.json(formulacoesComItens)
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const user = await getUserFromRequest(req)
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const { 
            id, 
            nome, 
            descricao, 
            fase, 
            ativa, 
            duracao_dias, 
            quantidade_total, 
            consumo_diario, 
            lote_id, 
            ajuste_ambiental, 
            data_termino_prevista,
            itens
        } = body

        // First save the formulacao
        const { data: formulacaoData, error: errorFormulacao } = await supabaseAdmin
            .from("formulacoes")
            .upsert({
                id,
                user_id: user.id,
                nome,
                descricao,
                fase,
                ativa,
                duracao_dias,
                quantidade_total,
                consumo_diario,
                lote_id,
                ajuste_ambiental,
                data_termino_prevista,
                updated_at: new Date().toISOString()
            }, { onConflict: "id" })
            .select()
            .single()

        if (errorFormulacao) {
            console.error("[API/Formulacoes] Erro ao salvar formulacao:", errorFormulacao)
            return NextResponse.json({ error: errorFormulacao.message }, { status: 500 })
        }

        // If there are items, save them
        if (itens && itens.length > 0) {
            // First delete existing items for this formulacao (if updating)
            if (formulacaoData.id) {
                await supabaseAdmin
                    .from("itens_formulacao")
                    .delete()
                    .eq("formulacao_id", formulacaoData.id)
            }

            // Insert new items
            const itensParaSalvar = itens.map((item: any) => ({
                formulacao_id: formulacaoData.id,
                ingrediente_id: item.ingrediente_id || item.ingredienteId,
                percentual: item.percentual
            }))

            const { error: errorItens } = await supabaseAdmin
                .from("itens_formulacao")
                .insert(itensParaSalvar)

            if (errorItens) {
                console.error("[API/Formulacoes] Erro ao salvar itens:", errorItens)
                return NextResponse.json({ error: errorItens.message }, { status: 500 })
            }
        }

        // Get the saved formulacao with items to return
        const { data: savedItens } = await supabaseAdmin
            .from("itens_formulacao")
            .select("*")
            .eq("formulacao_id", formulacaoData.id)

        return NextResponse.json({
            ...formulacaoData,
            itens: savedItens
        })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
