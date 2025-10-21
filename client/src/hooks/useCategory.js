import React, { useState, useEffect, useContext, createContext } from "react";
import toast from "react-hot-toast";
import axios from "axios";

const CategoryContext = createContext();

const CategoryProvider = ({ children }) => {
  const [categories, setCategories] = useState([]);

  const getCategories = async () => {
    try {
      const { data } = await axios.get("/api/v1/category/get-category");
      setCategories(data?.category);
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong in getting category");
    }
  };

  useEffect(() => {
    getCategories();
  }, []);

  return (
    <CategoryContext.Provider value={[categories, getCategories]}>
        {children}
    </CategoryContext.Provider>
  )
};

const useCategory = () => {
    const context = useContext(CategoryContext);
    if (context === undefined) {
        throw new Error('useCategory must be used within a CategoryProvider');
    }
    return context;
}

export { CategoryProvider, useCategory };
