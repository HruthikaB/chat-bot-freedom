import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center">
      <h1 className="text-6xl font-bold text-shop-purple mb-4">404</h1>
      <p className="text-xl text-gray-600 mb-8">Page not found</p>
      <Button 
        className="bg-shop-purple hover:bg-shop-purple/90"
        onClick={() => navigate("/")}
      >
        Return to Home
      </Button>
    </div>
  );
};

export default NotFound;