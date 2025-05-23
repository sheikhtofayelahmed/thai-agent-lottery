"use client";
import { AgentProvider, useAgent } from "@/context/AgentContext";
import { useEffect, useState } from "react";

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [fetched, setFetched] = useState(false);
  const { agentId } = useAgent();
  const [isGameOn, setIsGameOn] = useState(null);
  const [players, setPlayers] = useState([]);
  const [threeUp, setThreeUp] = useState("XXX");
  const [downGame, setDownGame] = useState("X");
  const [date, setDate] = useState("---");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/win-status");
        const data = await res.json();
        setThreeUp(data.threeUp);
        setDownGame(data.downGame);
        setDate(data.date);
      } catch (error) {
        console.error("Error fetching winning numbers:", error);
      }
    };

    fetchData();
  }, []);

  const fetchPlayersByAgentId = async (agentId) => {
    setLoading(true);
    setFetched(false);

    try {
      const res = await fetch("/api/getPlayersByAgentId", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId }),
      });

      const data = await res.json();

      if (res.ok) {
        setPlayers(data.players || []);
      } else {
        console.error(data.message || "Failed to fetch players.");
        setPlayers([]);
      }
    } catch (error) {
      console.error("Failed to fetch:", error);
      setPlayers([]);
    } finally {
      setLoading(false);
      setFetched(true);
    }
  };

  useEffect(() => {
    const fetchGameStatus = async () => {
      try {
        const res = await fetch("/api/game-status");
        const data = await res.json();
        setIsGameOn(data.isGameOn);
      } catch (error) {
        console.error("Failed to fetch game status:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGameStatus();
  }, []);

  useEffect(() => {
    if (agentId) {
      fetchPlayersByAgentId(agentId);
    }
  }, [agentId]);

  const totalAmounts = players.reduce(
    (acc, player) => {
      acc.ThreeD += player.amountPlayed.ThreeD;
      acc.TwoD += player.amountPlayed.TwoD;
      acc.OneD += player.amountPlayed.OneD;
      return acc;
    },
    { ThreeD: 0, TwoD: 0, OneD: 0 }
  );

  const grandTotal =
    totalAmounts.ThreeD + totalAmounts.TwoD + totalAmounts.OneD;
  const getPermutations = (str) => {
    if (str.length <= 1) return [str];
    let perms = [];
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      const remaining = str.slice(0, i) + str.slice(i + 1);
      for (const perm of getPermutations(remaining)) {
        perms.push(char + perm);
      }
    }
    return [...new Set(perms)];
  };
  const isWinningInput = (input) => {
    const parts = input.split("=");
    const number = parts[0];
    const amounts = parts.slice(1).map(Number);
    const permutations = getPermutations(threeUp);
    const reversedDown = downGame.split("").reverse().join("");
    const sumOfDigits = threeUp
      .split("")
      .reduce((sum, d) => sum + parseInt(d), 0);
    const lastDigitOfSum = sumOfDigits % 10;

    if (number.length === 3) {
      if (number === threeUp) return true;
      if (permutations.includes(number)) {
        return amounts.length >= 2; // Rumble condition (like STR=50=60)
      }
    }

    if (number.length === 2) {
      if (number === downGame) return true;
      if (number === reversedDown) {
        return amounts.length >= 2; // Rumble condition for downGame
      }
    }

    if (number.length === 1) {
      return parseInt(number) === lastDigitOfSum;
    }

    return false;
  };

  if (loading) return <p>Loading...</p>;
  if (fetched && players.length === 0)
    return <p>No players found for this agent.</p>;

  return (
    <AgentProvider>
      <div className="min-h-screen p-6 bg-gradient-to-br from-black to-red-900 text-white font-mono">
        {loading && (
          <p className="text-yellow-300 mt-6">⏳ Loading player data...</p>
        )}

        {!loading && fetched && players.length === 0 && (
          <div className="flex items-center justify-center h-[60vh]">
            <p className="text-pink-400 text-3xl font-bold text-center">
              😕 No player data found for this agent.
            </p>
          </div>
        )}
        {!loading && players.length > 0 && (
          <div className="mt-8">
            <div className="mt-8 mb-8 max-w-4xl mx-auto">
              <div className="my-4 bg-gray-900 bg-opacity-80 rounded-lg shadow-md ring-2 ring-yellow-500 p-6 text-center">
                <h2 className="text-3xl font-bold text-yellow-400 mb-6 animate-pulse">
                  📊 Game & Player Summary
                </h2>

                <table className="w-full border-collapse font-mono text-sm rounded-lg overflow-hidden shadow-lg">
                  <thead>
                    <tr className="bg-gradient-to-r from-red-600 to-yellow-600 text-white text-lg">
                      <th className="border border-gray-700 px-4 py-3 text-left w-1/3">
                        Category
                      </th>
                      <th className="border border-gray-700 px-4 py-3 text-left w-1/3">
                        Details / Amount
                      </th>
                      <th className="border border-gray-700 px-4 py-3 text-left w-1/3">
                        Remarks / After Deduction
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Winning Numbers Section */}
                    <tr className="bg-gray-800 text-yellow-300">
                      <td className="border border-gray-700 px-4 py-3 font-semibold">
                        🏆 Winning Date
                      </td>
                      <td className="border border-gray-700 px-4 py-3">
                        <span className="bg-gradient-to-r from-yellow-400 to-red-500 text-transparent bg-clip-text font-bold text-lg">
                          {date}
                        </span>
                      </td>
                      <td className="border border-gray-700 px-4 py-3"></td>{" "}
                      {/* Empty for alignment */}
                    </tr>
                    <tr className="bg-gray-700 text-yellow-300">
                      <td className="border border-gray-700 px-4 py-3 font-semibold">
                        🎯 3UP Winning
                      </td>
                      <td className="border border-gray-700 px-4 py-3">
                        <span className="text-4xl font-extrabold tracking-widest text-yellow-500">
                          {threeUp}
                        </span>
                      </td>
                      <td className="border border-gray-700 px-4 py-3">
                        <span className="text-sm text-gray-400">
                          (Latest Draw)
                        </span>
                      </td>
                    </tr>
                    <tr className="bg-gray-800 text-yellow-300">
                      <td className="border border-gray-700 px-4 py-3 font-semibold">
                        💥 DOWN Winning
                      </td>
                      <td className="border border-gray-700 px-4 py-3">
                        <span className="text-4xl font-extrabold tracking-widest text-pink-500">
                          {downGame}
                        </span>
                      </td>
                      <td className="border border-gray-700 px-4 py-3">
                        <span className="text-sm text-gray-400">
                          (Latest Draw)
                        </span>
                      </td>
                    </tr>

                    {/* Separator Row */}
                    <tr className="bg-gray-600">
                      <td
                        className="border border-gray-700 px-4 py-1"
                        colSpan="3"
                      ></td>
                    </tr>

                    {/* All Players Total Summary Section */}
                    <tr className="bg-green-800 text-white text-lg">
                      <th
                        className="border border-gray-700 px-4 py-3 text-left"
                        colSpan="3"
                      >
                        📊 All Players Total Summary
                      </th>
                    </tr>
                    <tr className="bg-gray-800">
                      <td className="border border-gray-700 px-4 py-2">
                        🎯 3D Total
                      </td>
                      <td className="border border-gray-700 px-4 py-2 text-green-400">
                        {totalAmounts.ThreeD.toFixed(2)}
                      </td>
                      <td className="border border-gray-700 px-4 py-2 text-green-400">
                        {(totalAmounts.ThreeD * 0.6).toFixed(2)}
                      </td>
                    </tr>
                    <tr className="bg-gray-700">
                      <td className="border border-gray-700 px-4 py-2">
                        🎯 2D Total
                      </td>
                      <td className="border border-gray-700 px-4 py-2 text-green-400">
                        {totalAmounts.TwoD.toFixed(2)}
                      </td>
                      <td className="border border-gray-700 px-4 py-2 text-green-400">
                        {(totalAmounts.TwoD * 0.8).toFixed(2)}
                      </td>
                    </tr>
                    <tr className="bg-gray-800">
                      <td className="border border-gray-700 px-4 py-2">
                        🎯 1D Total
                      </td>
                      <td className="border border-gray-700 px-4 py-2 text-green-400">
                        {totalAmounts.OneD.toFixed(2)}
                      </td>
                      <td className="border border-gray-700 px-4 py-2 text-green-400">
                        {totalAmounts.OneD.toFixed(2)}
                      </td>
                    </tr>
                    <tr className="bg-gray-900 font-bold text-lg text-yellow-300">
                      <td className="border border-gray-700 px-4 py-2">
                        🔢 Grand Total
                      </td>
                      <td className="border border-gray-700 px-4 py-2">
                        {grandTotal.toFixed(2)}
                      </td>
                      <td className="border border-gray-700 px-4 py-2">
                        {(
                          totalAmounts.ThreeD * 0.6 +
                          totalAmounts.TwoD * 0.8 +
                          totalAmounts.OneD
                        ).toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <h3 className="text-2xl text-yellow-400 mb-6 font-semibold text-center">
              🎉 Player Summary 🎉
            </h3>

            <div className="space-y-6 max-w-4xl mx-auto max-h-[60vh] overflow-y-auto pr-2">
              {players.map((player, idx) => (
                <div key={idx} className="bg-gray-800 rounded-lg shadow p-5">
                  <p className="text-yellow-300 font-bold text-xl text-center">
                    🎫 {player.voucher || "N/A"}
                  </p>
                  <div className="flex justify-between items-start mb-4">
                    {/* Player Info */}
                    <div>
                      <h4 className="text-xl font-bold mb-1">{player.name}</h4>
                      <p className="text-gray-400 text-sm">
                        Time: {new Date(player.time).toLocaleString()}
                      </p>
                      <p className="text-gray-400 text-sm">
                        Entries: {player.entries.length}
                      </p>
                    </div>

                    {/* Print Button */}
                    <div>
                      <button
                        onClick={() => window.print()}
                        className="py-2 px-4 rounded bg-purple-600 hover:bg-purple-700 transition"
                        title="Print Player Info"
                      >
                        🖨️ Print
                      </button>
                    </div>
                  </div>
                  <table className="w-full border-collapse text-sm font-mono mt-4">
                    <thead>
                      <tr className="bg-yellow-600 text-black">
                        <th className="border px-3 py-2 text-left">#</th>
                        <th className="border px-3 py-2 text-left">Input</th>
                      </tr>
                    </thead>
                    <tbody>
                      {player.entries.map((entry, entryIdx) => {
                        const isWinning = isWinningInput(entry.input);
                        return (
                          <tr
                            key={entryIdx}
                            className={`${
                              entryIdx % 2 === 0 ? "bg-gray-700" : "bg-gray-800"
                            } ${isWinning ? "winning-animation" : ""}`}
                          >
                            <td className="border px-3 py-2">{entryIdx + 1}</td>
                            <td className="border px-3 py-2">{entry.input}</td>
                          </tr>
                        );
                      })}{" "}
                      <div className="mt-4 text-yellow-300">
                        <table className="w-full border-collapse mt-4 font-mono text-sm rounded overflow-hidden shadow-md">
                          <thead>
                            <tr className="bg-red-700 text-white">
                              <th className="border px-4 py-2 text-left">
                                Category
                              </th>
                              <th className="border px-4 py-2 text-left">
                                Amount
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="bg-gray-800">
                              <td className="border px-4 py-2">🎯 3D Total</td>
                              <td className="border px-4 py-2 text-green-400">
                                {player.amountPlayed.ThreeD}
                              </td>
                            </tr>
                            <tr className="bg-gray-900">
                              <td className="border px-4 py-2">🎯 2D Total</td>
                              <td className="border px-4 py-2 text-green-400">
                                {player.amountPlayed.TwoD}
                              </td>
                            </tr>
                            <tr className="bg-gray-800">
                              <td className="border px-4 py-2">🎯 1D Total</td>
                              <td className="border px-4 py-2 text-green-400">
                                {player.amountPlayed.OneD}
                              </td>
                            </tr>
                            <tr className="bg-gray-900 font-bold text-lg">
                              <td className="border px-4 py-2">
                                🔢 Grand Total
                              </td>
                              <td className="border px-4 py-2 text-yellow-300">
                                {(
                                  player.amountPlayed.ThreeD +
                                  player.amountPlayed.TwoD +
                                  player.amountPlayed.OneD
                                ).toFixed(2)}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AgentProvider>
  );
};

export default Reports;
