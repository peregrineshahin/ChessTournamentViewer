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
        setCurrentMoveNumber(game.history().length - 2);
      else setCurrentMoveNumber(currentMoveNumber - 1);
    }

    function redoMove() {
      if (currentMoveNumber + 1 < moves.length)
        setCurrentMoveNumber(currentMoveNumber + 1);
      else setCurrentMoveNumber(-1);
    }

    return (
      <>
        <div className="moveList" ref={moveListRef}>
          {moves.map((move, i) => {
            const moveClass =
              i === currentMoveNumber ||
              (currentMoveNumber === -1 && i === moves.length - 1)
                ? " currentMove"
                : "";
            return (
              <Fragment key={i}>
                {i % 2 == 0 ? (
                  <span className={"moveNumber" + moveClass}>
                    {i / 2 + 1}.{" "}
                  </span>
                ) : null}
                <span
                  className={"move" + moveClass}
                  onClick={() => setCurrentMoveNumber(i)}
                >
                  {move}
                </span>
              </Fragment>
            );
          })}
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
