export async function encodePayload(payload: string){
    if(!isJSON(payload)) return "INVALID_JSON"
    const encoder = new TextEncoder()
    const data = encoder.encode(payload)

    const cs = new CompressionStream('gzip')
    const writer = cs.writable.getWriter()
    writer.write(data)
    writer.close()

    const compressed = await new Response(cs.readable).arrayBuffer()

    const base64 = btoa(
        String.fromCharCode(...new Uint8Array(compressed))
    )

    return base64.replaceAll('/','_').replaceAll('+','-')
}

export function isJSON(str: string){
    try{
        JSON.parse(str)
        return true
    } catch {
        return false
    }
}