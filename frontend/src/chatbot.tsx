import React, { useState } from "react";

const Chatbot = () => {
  const [step, setStep] = useState(0);
  const [filters, setFilters] = useState({});
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState("");

  const questions = [
    { key: "type", text: "What type of shoes are you looking for? (e.g., sneakers, dress shoes, sandals)" },
    { key: "brand", text: "Do you have a preferred brand?" },
    { key: "size", text: "What size are you looking for?" },
    { key: "color", text: "Any color preference?" }
  ];

  const handleAnswer = async () => {
    const key = questions[step].key;
    const updatedFilters = { ...filters, [key]: answer.trim() };
    setFilters(updatedFilters);
    setAnswer("");

    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      setLoading(true);
      try {
        const query = new URLSearchParams(updatedFilters).toString();
        const res = await fetch(`/api/products?${query}`);
        const data = await res.json();
        setProducts(data);
      } catch (error) {
        console.error("Failed to fetch products", error);
      }
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 700, margin: "40px auto", padding: 20, fontFamily: "sans-serif" }}>
      <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 20, backgroundColor: "#fefefe" }}>
        {step < questions.length ? (
          <>
            <p style={{ fontSize: 18, fontWeight: 600 }}>{questions[step].text}</p>
            <input
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAnswer()}
              placeholder="Type and press Enter"
              style={{
                marginTop: 10,
                padding: 10,
                width: "100%",
                border: "1px solid #ccc",
                borderRadius: 6
              }}
            />
          </>
        ) : loading ? (
          <p>Loading matching shoes...</p>
        ) : (
          <>
            <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 10 }}>Here are your results:</p>
            {products.length === 0 ? (
              <p>No products matched your criteria.</p>
            ) : (
              <div style={{ display: "grid", gap: 16 }}>
                {products.map((product) => (
                  <div
                    key={product.id}
                    style={{
                      display: "flex",
                      gap: 16,
                      border: "1px solid #ccc",
                      borderRadius: 10,
                      padding: 16,
                      backgroundColor: "#fff"
                    }}
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      style={{ width: 120, height: 120, objectFit: "cover", borderRadius: 6 }}
                    />
                    <div>
                      <h3 style={{ fontSize: 18, fontWeight: 600 }}>{product.name}</h3>
                      <p style={{ margin: "4px 0" }}>{product.brand} — Size {product.size} — {product.color}</p>
                      <p style={{ fontWeight: "bold" }}>{product.price}</p>
                      <a
                        href={product.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "inline-block",
                          marginTop: 8,
                          padding: "6px 12px",
                          backgroundColor: "#007bff",
                          color: "#fff",
                          borderRadius: 4,
                          textDecoration: "none"
                        }}
                      >
                        View Product
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Chatbot;
