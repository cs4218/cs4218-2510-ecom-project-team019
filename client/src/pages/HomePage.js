import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Checkbox, Radio } from 'antd';
import { Prices } from '../components/Prices';
import { useCart } from '../context/cart';
import axios from 'axios';
import toast from 'react-hot-toast';
import Layout from './../components/Layout';
import { AiOutlineReload } from 'react-icons/ai';
import '../styles/Homepages.css';

const HomePage = () => {
    const navigate = useNavigate();
    const [cart, setCart] = useCart();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);

    const [filteredCategories, setFilteredCategories] = useState([]);
    const [filteredPrices, setFilteredPrices] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);

    useEffect(() => {
        if (!products.length) return;

        const filtered = products.filter((p) => {
            // Show all products if no filters selected
            const categoryMatch = filteredCategories.length === 0 || filteredCategories.some((c) => c._id === p.category);

            const priceMatch =
                filteredPrices.length === 0 ||
                filteredPrices.some(
                    (priceObject) => Math.floor(p.price) >= priceObject.priceRange[0] && Math.floor(p.price) <= priceObject.priceRange[1]
                );

            return categoryMatch && priceMatch;
        });

        setFilteredProducts(filtered);
    }, [filteredCategories, filteredPrices, products]);

    useEffect(async () => {
        const getAllCategories = async () => {
            try {
                const { data } = await axios.get('/api/v1/category/get-category');
                if (data?.success) {
                    setCategories(data?.category);
                }
            } catch (error) {
                console.log(error);
            }
        };

        const getAllProducts = async () => {
            try {
                setLoading(true);
                const { data } = await axios.get(`/api/v1/product/product-list/${page}`);
                setLoading(false);
                setProducts(data.products);
            } catch (error) {
                setLoading(false);
                console.log(error);
            }
        };

        const getTotal = async () => {
            try {
                const { data } = await axios.get('/api/v1/product/product-count');
                setTotal(data?.total);
            } catch (error) {
                console.log(error);
            }
        };

        await getAllCategories();
        await getAllProducts();
        await getTotal();
    }, []);

    useEffect(async () => {
        if (page === 1) return;
        const loadMore = async () => {
            try {
                setLoading(true);
                const { data } = await axios.get(`/api/v1/product/product-list/${page}`);
                setLoading(false);
                setProducts([...products, ...data?.products]);
            } catch (error) {
                console.log(error);
                setLoading(false);
            }
        };

        await loadMore();
    }, [page]);

    // filter by categories
    const handleFilterCategories = (checked, category) => {
        if (checked) {
            const copiedCategories = [...filteredCategories];
            copiedCategories.push(category);

            setFilteredCategories(copiedCategories);
        } else {
            const copiedCategories = [...filteredCategories].filter((c) => c._id !== category._id);

            setFilteredCategories(copiedCategories);
        }
    };

    const handleFilterPrice = (checked, Price) => {
        if (checked) {
            const copiedPrices = [...filteredPrices];
            copiedPrices.push(Price);

            setFilteredPrices(copiedPrices);
        } else {
            const copiedPrices = [...filteredPrices].filter((p) => p._id !== Price._id);

            setFilteredPrices(copiedPrices);
        }
    };

    const handleResetFilters = () => {
        setFilteredCategories([]);
        setFilteredPrices([]);
    };

    return (
        <Layout title={'ALL Products - Best offers '}>
            {/* banner image */}
            <img src="/images/Virtual.png" className="banner-img" alt="bannerimage" width={'100%'} />
            {/* banner image */}
            <div className="container-fluid row mt-3 home-page">
                <div className="col-md-3 filters">
                    <h4 className="text-center">Filter By Category</h4>
                    <div className="d-flex flex-column">
                        {categories?.map((c) => (
                            <Checkbox
                                key={c._id}
                                checked={filteredCategories.some((fc) => fc._id === c._id)}
                                onChange={(e) => handleFilterCategories(e.target.checked, c)}
                            >
                                {c.name}
                            </Checkbox>
                        ))}
                    </div>
                    {/* price filter */}
                    <h4 className="text-center mt-4">Filter By Price</h4>
                    <div className="d-flex flex-column">
                        <div className="d-flex flex-column">
                            {Prices?.map((p) => (
                                <Checkbox
                                    key={p._id}
                                    checked={filteredPrices.some((fp) => fp._id === p._id)}
                                    onChange={(e) => handleFilterPrice(e.target.checked, p)}
                                >
                                    {p.name}
                                </Checkbox>
                            ))}
                        </div>
                    </div>
                    <div className="d-flex flex-column">
                        <button className="btn btn-danger" onClick={() => handleResetFilters()}>
                            RESET FILTERS
                        </button>
                    </div>
                </div>
                <div className="col-md-9 ">
                    <h1 className="text-center">All Products</h1>
                    <div className="d-flex flex-wrap">
                        {filteredProducts?.map((p) => (
                            <div className="card m-2" key={p._id}>
                                <img src={`/api/v1/product/product-photo/${p._id}`} className="card-img-top" alt={p.name} />
                                <div className="card-body">
                                    <div className="card-name-price">
                                        <h5 className="card-title">{p.name}</h5>
                                        <h5 className="card-title card-price">
                                            {p.price.toLocaleString('en-US', {
                                                style: 'currency',
                                                currency: 'USD',
                                            })}
                                        </h5>
                                    </div>
                                    <p className="card-text ">{p.description.substring(0, 60)}...</p>
                                    <div className="card-name-price">
                                        <button className="btn btn-info ms-1" onClick={() => navigate(`/product/${p.slug}`)}>
                                            More Details
                                        </button>
                                        <button
                                            className="btn btn-dark ms-1"
                                            onClick={() => {
                                                setCart([...cart, p]);
                                                localStorage.setItem('cart', JSON.stringify([...cart, p]));
                                                toast.success('Item Added to cart');
                                            }}
                                        >
                                            ADD TO CART
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="m-2 p-3">
                        {products && products.length < total && (
                            <button
                                className="btn loadmore"
                                onClick={(e) => {
                                    e.preventDefault();
                                    setPage(page + 1);
                                }}
                            >
                                {loading ? (
                                    'Loading ...'
                                ) : (
                                    <>
                                        {' '}
                                        Loadmore <AiOutlineReload />
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default HomePage;
