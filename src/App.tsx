import { Chessground } from '@lichess-org/chessground'
import { Chess } from 'chess.js'

import './App.css'
import { useEffect, useRef, useState } from 'react'
import { type Api } from '@lichess-org/chessground/api'
import { CCCWebSocket } from './websocket'
import type { CCCLiveInfo, CCCEngine, CCCMessage, CCCEventUpdate } from './types'
import type { Key } from '@lichess-org/chessground/types'
import type { DrawShape } from '@lichess-org/chessground/draw'

type EngineMap = Record<string, CCCEngine>

type EngineImages = Record<string, string>

function load_engine_images(engines: CCCEngine[]): EngineImages {

    const engine_images: EngineImages = {}

    const base_url = "https://images.chesscomfiles.com/chess-themes/computer_chess_championship/avatars/"

    const formats = [
        "sm_%s.png",
        "%s.png",
        "sm_%s@2x.png",
        "%s@2x.png",
        "lrg_%s.png",
        "lrg_%s@2x.png",
    ]

    for (const engine of engines) {
        engine_images[engine.id] = base_url + formats[2].replace("%s", engine.imageUrl)
    }

    return engine_images
}

function App() {

    const boardElementRef = useRef<HTMLDivElement>(null)
    const boardRef = useRef<Api>(null)
    const whiteArrow = useRef<[DrawShape, DrawShape]>(null)
    const blackArrow = useRef<[DrawShape, DrawShape]>(null)

    const [game, setGame] = useState(new Chess())
    const [ws] = useState(new CCCWebSocket("wss://ccc-api.gcp-prod.chess.com/ws"))

    const [engines, setEngines] = useState<EngineMap>({})
    const [white, setWhite] = useState<CCCEngine>()
    const [black, setBlack] = useState<CCCEngine>()
    const [engineImages, setEngineImages] = useState<EngineImages>({})

    const [liveInfoWhite, setLiveInfoWhite] = useState<CCCLiveInfo>()
    const [liveInfoBlack, setLiveInfoBlack] = useState<CCCLiveInfo>()

    const [cccEvent, setCccEvent] = useState<CCCEventUpdate>()

    function getArrows() {
        const arrows: DrawShape[] = []
        if (whiteArrow.current)
            arrows.push(whiteArrow.current[0])
        if (blackArrow.current)
            arrows.push(blackArrow.current[0])
        return arrows;
    }

    function handleMessage(msg: CCCMessage) {

        if (msg.type === "eventUpdate") {
            setCccEvent(msg)

            const engines: EngineMap = {}
            for (const engine of msg.tournamentDetails.engines)
                engines[engine.id] = engine
            setEngines(engines)

            const present = msg.tournamentDetails.schedule.present
            const white_engine = engines[present.whiteId]
            const black_engine = engines[present.blackId]
            setWhite(white_engine)
            setBlack(black_engine)

            setEngineImages(load_engine_images(msg.tournamentDetails.engines))
        }

        if (msg.type === "gameUpdate") {
            if (!boardRef.current) {
                console.warn("Received 'gameUpdate' event, but the board isn't ready yet")
                return;
            }

            game.loadPgn(msg.gameDetails.pgn)

            const history = game.history({ verbose: true })
            const last_move = history[history.length - 1]

            boardRef.current.set({
                fen: game.fen(),
                lastMove: [last_move.from, last_move.to],
                drawable: {
                    brushes: {
                        white: {
                            key: "white",
                            color: "#fff",
                            opacity: 0.7,
                            lineWidth: 10,
                        },
                        black: {
                            key: "black",
                            color: "#000",
                            opacity: 0.7,
                            lineWidth: 10,
                        }
                    },
                    enabled: false,
                    eraseOnMovablePieceClick: false,
                    shapes: getArrows()
                }
            })
        }

        if (msg.type === "clocks") {
            return
        }

        if (msg.type === "liveInfo") {
            const pv = msg.info.pv.split(" ")

            if (msg.info.color == "white") {
                setLiveInfoWhite(msg)

                if (pv.length > 1)
                    whiteArrow.current = [
                        {
                            orig: pv[0].slice(0, 2) as Key,
                            dest: pv[0].slice(2, 4) as Key,
                            brush: "white"
                        },
                        {
                            orig: pv[1].slice(0, 2) as Key,
                            dest: pv[1].slice(2, 4) as Key,
                            brush: "white"
                        }
                    ]
                else
                    whiteArrow.current = [
                        {
                            orig: pv[0].slice(0, 2) as Key,
                            dest: pv[0].slice(2, 4) as Key,
                            brush: "white"
                        },
                        {
                            orig: pv[0].slice(0, 2) as Key,
                            dest: pv[0].slice(2, 4) as Key,
                            brush: "white"
                        }
                    ]
            }
            else {
                setLiveInfoBlack(msg)
                if (pv.length > 1)
                    blackArrow.current = [
                        {
                            orig: pv[0].slice(0, 2) as Key,
                            dest: pv[0].slice(2, 4) as Key,
                            brush: "black"
                        },
                        {
                            orig: pv[1].slice(0, 2) as Key,
                            dest: pv[1].slice(2, 4) as Key,
                            brush: "black"
                        }
                    ]
                else
                    blackArrow.current = [
                        {
                            orig: pv[0].slice(0, 2) as Key,
                            dest: pv[0].slice(2, 4) as Key,
                            brush: "black"
                        },
                        {
                            orig: pv[0].slice(0, 2) as Key,
                            dest: pv[0].slice(2, 4) as Key,
                            brush: "black"
                        }
                    ]
            }

            if (!boardRef.current) {
                console.warn("Received 'liveInfo' event, but the board isn't ready yet")
                return;
            }

            const history = game.history({ verbose: true })
            const last_move = history[history.length - 1]

            boardRef.current.set({
                fen: game.fen(),
                lastMove: [last_move.from, last_move.to],
                drawable: {
                    brushes: {
                        white: {
                            key: "white",
                            color: "#fff",
                            opacity: 0.7,
                            lineWidth: 10,
                        },
                        black: {
                            key: "black",
                            color: "#000",
                            opacity: 0.7,
                            lineWidth: 10,
                        }
                    },
                    enabled: false,
                    eraseOnMovablePieceClick: false,
                    shapes: getArrows()
                }
            })
        }

        if (msg.type === "newMove") {
            if (!boardRef.current) {
                console.warn("Received 'newMove' event, but the board isn't ready yet")
                return;
            }

            const from = msg.move.slice(0, 2) as Key
            const to = msg.move.slice(2, 4) as Key
            const promo = msg.move.length > 4 ? msg.move[4] : undefined

            if (game.turn() == "w" && whiteArrow.current) {
                whiteArrow.current = [whiteArrow.current[1], whiteArrow.current[0]]
            } else if (blackArrow.current) {
                blackArrow.current = [blackArrow.current[1], blackArrow.current[0]]
            }

            game.move({ from, to, promotion: promo as any })

            boardRef.current.set({
                fen: game.fen(),
                lastMove: [from, to],
                drawable: {
                    brushes: {
                        white: {
                            key: "white",
                            color: "#fff",
                            opacity: 0.7,
                            lineWidth: 10,
                        },
                        black: {
                            key: "black",
                            color: "#000",
                            opacity: 0.7,
                            lineWidth: 10,
                        }
                    },
                    enabled: false,
                    eraseOnMovablePieceClick: false,
                    shapes: getArrows()
                }
            })
        }
    }

    useEffect(() => {
        if (boardRef.current || !boardElementRef.current) return;

        boardRef.current = Chessground(boardElementRef.current, {
            fen: game.fen(),
            orientation: 'white',
            coordinates: true,
            draggable: { enabled: true },
            movable: { free: false, color: undefined, dests: undefined },
            selectable: { enabled: false },
        })

        ws.connect(handleMessage)

        return () => ws.disconnect();
    }, [boardElementRef.current])

    const sortedEngines = Object.keys(engines).map(id => engines[id]).sort((a, b) => Number(b.points) - Number(a.points))

    return (
        <div className="app">

            <div className="boardWindow">
                {liveInfoBlack && black && <EngineComponent info={liveInfoBlack} engine={black} imageSrc={engineImages[black.id]} />}

                <div ref={boardElementRef} className="board"></div>

                {liveInfoWhite && white && <EngineComponent info={liveInfoWhite} engine={white} imageSrc={engineImages[white.id]} />}
            </div>

            <div className="standingsWindow">
                <h2>Standings</h2>
                <div className="standings">
                    {sortedEngines.map((engine, index) => {
                        const playedGames = Number(cccEvent?.tournamentDetails.schedule.past.filter(game => game.blackId === engine.id || game.whiteId === engine.id).length);
                        return (
                            <div key={engine.id} className="standingsEntry">
                                <div>#{index + 1}</div>
                                <div>{engine.name}</div>
                                <div className="standingsScore">{engine.points} / {playedGames}.00 ({engine.perf}%)</div>
                                <div>{engine.rating}</div>
                            </div>
                        )
                    })}
                </div>
            </div>

        </div>
    )
}

type EngineComponentProps = {
    info: CCCLiveInfo
    imageSrc: string
    engine: CCCEngine
}

function EngineComponent({ engine, info, imageSrc }: EngineComponentProps) {
    return (
        <div className="engine">
            <img src={imageSrc} />
            <span className="engine-name">{engine.name}</span>
            <span className="engine-eval">{info.info.score}</span>
            <span className="engine-field"> D: <span>{info.info.depth} / {info.info.seldepth}</span></span>
            <span className="engine-field"> N: <span>{info.info.nodes}</span></span>
            <span className="engine-field"> NPS: <span>{info.info.speed}</span></span>
        </div>
    )
}

export default App
