import type { Chess } from "chess.js";
import { Fragment, memo, useEffect, useRef } from "react";
import "./MoveList.css";

type MoveListProps = {
  game: Chess;
  currentMoveNumber: number;
  setCurrentMoveNumber: (moveNumber: number) => void;
};

const MoveList = memo(
  ({ game, currentMoveNumber, setCurrentMoveNumber }: MoveListProps) => {
    const moves = game.history();
    const moveListRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (!moveListRef.current) return;
      moveListRef.current.scrollTop = moveListRef.current.scrollHeight;
    }, [moveListRef.current, moves.length]);

    function undoAllMoves() {
      setCurrentMoveNumber(0);
    }

    function redoAllMoves() {
      setCurrentMoveNumber(-1);
    }

    function undoMove() {
      if (currentMoveNumber === -1)
        setCurrentMoveNumber(game.history().length - 1);
      else setCurrentMoveNumber(currentMoveNumber - 1);
    }

    function redoMove() {
      if (currentMoveNumber + 1 < moves.length)
        setCurrentMoveNumber(currentMoveNumber + 1);
      else setCurrentMoveNumber(-1);
    }

    useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (
          event.target instanceof HTMLInputElement ||
          event.target instanceof HTMLTextAreaElement
        ) {
          return;
        }

        if (event.key === "ArrowLeft" && currentMoveNumber !== 0) {
          undoMove();
        } else if (event.key === "ArrowRight" && currentMoveNumber !== -1) {
          redoMove();
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [currentMoveNumber, moves.length]);

    return (
      <>
        <div className="moveList" ref={moveListRef}>
          <table className="moveTable">
            <tbody>
              {moves.map((move, i) => {
                const moveClass =
                  i === currentMoveNumber ||
                  (currentMoveNumber === -1 && i === moves.length - 1)
                    ? " currentMove"
                    : "";

                // Only render row on white moves (even index)
                if (i % 2 === 0) {
                  return (
                    <tr key={i}>
                      <td
                        className={"move" + moveClass}
                        onClick={() => setCurrentMoveNumber(i)}
                      >
                        {i / 2 + 1}. {move}
                      </td>

                      <td>
                        {moves[i + 1] ? (
                          <span
                            className={
                              "move" +
                              (i + 1 === currentMoveNumber ||
                              (currentMoveNumber === -1 &&
                                i + 1 === moves.length - 1)
                                ? " currentMove"
                                : "")
                            }
                            onClick={() => setCurrentMoveNumber(i + 1)}
                          >
                            {moves[i + 1]}
                          </span>
                        ) : null}
                      </td>
                    </tr>
                  );
                }

                return null;
              })}
            </tbody>
          </table>
        </div>

        <div className="moveButtons">
          <button onClick={undoAllMoves} disabled={currentMoveNumber === 0}>
            {"<<"}
          </button>
          <button onClick={undoMove} disabled={currentMoveNumber === 0}>
            {"<"}
          </button>
          <button onClick={redoMove} disabled={currentMoveNumber === -1}>
            {">"}
          </button>
          <button onClick={redoAllMoves} disabled={currentMoveNumber === -1}>
            {">>"}
          </button>
        </div>
      </>
    );
  }
);

export { MoveList };
