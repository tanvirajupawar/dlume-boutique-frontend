import React, { useState, useRef, useEffect } from "react";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
  import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    ScrollView,
    Alert,
    Modal,
    Animated,
    KeyboardAvoidingView,
    Platform,
  } from "react-native";
import { FlatList } from "react-native";
  import { SafeAreaView } from "react-native-safe-area-context";
  import * as ImagePicker from "expo-image-picker";
  import * as Haptics from "expo-haptics";
import { Dimensions } from "react-native";
import { ActivityIndicator } from "react-native";
  import { Image } from "react-native";
  import axios from "axios";
  import Svg, { Path } from "react-native-svg";
  import { PanResponder } from "react-native";
  import DateTimePicker from "@react-native-community/datetimepicker";
import ViewShot from "react-native-view-shot";
import { BackHandler } from "react-native";
    const screenWidth = Dimensions.get("window").width;
    const BASE_URL = "https://dlume-boutique-backend.onrender.com";
const IG_SIZE = screenWidth * 0.2;   // 60% of screen

export default function AddOrderScreen({ goToOrders, setLeaveHandler, openDebug, editOrder }) {
const { user } = useContext(AuthContext);
const token = user?.token;

    // ==================== STATE ====================
    const [customerData, setCustomerData] = useState({
      name: "",
      careOf: "",
      mobileNo: "",
      contactNo: "",
    });

const [orderData, setOrderData] = useState({
  orderDate: new Date().toLocaleDateString("en-GB"),
});


useEffect(() => {
  if (token) {
    Haptics.selectionAsync();
    fetchNextOrderNumber();
  }
}, [token]);

useEffect(() => {
  if (token) {
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    console.log("✅ Token attached (order screen)");
  }
}, [token]);
  const [showDeliveryPicker, setShowDeliveryPicker] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerModal, setShowCustomerModal] = useState(false);
const [customerSelectMode, setCustomerSelectMode] = useState("main");
const [redoStack, setRedoStack] = useState([]);
   const [descriptionExpanded, setDescriptionExpanded] = useState(false);
const [orderNumber, setOrderNumber] = useState("");
const [creatingOrder, setCreatingOrder] = useState(false);
const submittingRef = useRef(false);   
const receiptCreatedRef = useRef(false);
const [orderId, setOrderId] = useState(null);
const orderIdRef = useRef(null); 
const [isSaved, setIsSaved] = useState(false);
const searchTimeout = useRef(null);
const [isAddingGarment, setIsAddingGarment] = useState(false);


const handleCustomerSearch = (text) => {
  setCustomerSearch(text);

  if (searchTimeout.current) {
    clearTimeout(searchTimeout.current);
  }

  searchTimeout.current = setTimeout(() => {
    setPage(1);
    setCustomers([]);          
    fetchCustomers(text, 1);
  }, 300);
};

const handleUndo = () => {
  const currentPaths = activeGarment.designPaths || [];
  if (!currentPaths.length) return;

  const updated = [...currentPaths];
  const last = updated.pop();

  updateActiveGarment({ designPaths: updated });
  setRedoStack(prev => [...prev, last]);
};

const handleRedo = () => {
  if (!redoStack.length) return;

  const updatedRedo = [...redoStack];
  const lastRedo = updatedRedo.pop();

  updateActiveGarment({
    designPaths: [...(activeGarment.designPaths || []), lastRedo],
  });

  setRedoStack(updatedRedo);
};

const handleClear = () => {
  setRedoStack([]);
  updateActiveGarment({ designPaths: [] });
};




const [garments, setGarments] = useState([
  {
    id: Date.now(),
    name: "Garment 1",
    isSaved: false,   
    extraWork: [],
        price: "", 
         deliveryDate: "",  
        clothImage: null, 
        designPaths: [], 
          designNotes: "", 
            description: "", 
measurements: {
  // 🔹 Upper Body
  shoulder: "",
  arm_length: "",
  sleeves_length: "",
  armhole: "",
  biceps: "",
  neck_size: "",
  back_neck: "",
  upper_chest: "",
  chest: "",
  waist: "",
  waist_2: "",
  hip: "",
  top_length: "",
  tucks: "",

  // 🔹 Lower Body
  pant_length: "",
  plazo_length: "",
  pyjama_length: "",
  salwar_length: "",
  round_up_1: "",
  round_up_2: "",
  round_up_3: "",
  main_round_up: "",

  // 🔹 Other
  aster: "",
  dupatta: "",
},
  },
]);




const [activeGarmentIndex, setActiveGarmentIndex] = useState(0);

const activeIndexRef = useRef(activeGarmentIndex);
const scrollRef = useRef(null);
const viewShotRef = useRef();

useEffect(() => {
  activeIndexRef.current = activeGarmentIndex;
}, [activeGarmentIndex]);



const activeGarment =
  garments[activeGarmentIndex] || {
    designPaths: [],
    extraWork: [],
    measurements: {},
  };


const updateActiveGarment = (updatedData) => {
  const updated = [...garments];
  updated[activeGarmentIndex] = {
    ...updated[activeGarmentIndex],
    ...updatedData,
  };
  setGarments(updated);
};

const saveCurrentDesignImage = async () => {
  if (!viewShotRef.current) return garments;

  // ✅ Skip capture if no paths drawn
  if (!activeGarment.designPaths || activeGarment.designPaths.length === 0) {
    return garments;
  }

  try {
    const imageUri = await viewShotRef.current.capture();

    const updatedGarments = garments.map((g, index) =>
      index === activeGarmentIndex
        ? { ...g, designImage: imageUri }
        : g
    );

    setGarments(updatedGarments);
    return updatedGarments;
  } catch (err) {
    console.log("Capture error:", err);
    return garments;
  }
};

const [paymentData, setPaymentData] = useState({
  advance: "",
  notes: "",
  discount: "",
  method: "",
});



    // UI State - All sections now collapsible
    const [showWorkDetailsModal, setShowWorkDetailsModal] = useState(false);
    const [essentialExpanded, setEssentialExpanded] = useState(true);
    const [workDetailsExpanded, setWorkDetailsExpanded] = useState(false);
    const [measurementsExpanded, setMeasurementsExpanded] = useState(false);
    const [designExpanded, setDesignExpanded] = useState(false);
    const [paymentExpanded, setPaymentExpanded] = useState(false);

    // Paint/Drawing State
    const [selectedTool, setSelectedTool] = useState("pen");
    const [selectedColor, setSelectedColor] = useState("#3B82F6");
    const [brushSize, setBrushSize] = useState(4);
 


    // Template state
    const [measurementTemplate, setMeasurementTemplate] = useState("");


  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);


const [page, setPage] = useState(1);

const fetchCustomers = async (search = "", pageNumber = 1) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/api/customers?search=${search}&limit=20&page=${pageNumber}`
    );

    const newData = response.data.data || [];

    if (pageNumber === 1) {
      setCustomers(newData);
    } else {
      setCustomers(prev => [...prev, ...newData]);
    }

  } catch (error) {
    console.log("Customer fetch error:", error);
  }
};


  const [newCustomer, setNewCustomer] = useState({
    first_name: "",
    last_name: "",
    contact_no_1: "",
    contact_no_2: "",
    email: "",
  });

const deleteGarment = (indexToDelete) => {
  if (garments.length === 1) {
    Alert.alert("Cannot Delete", "At least one garment is required.");
    return;
  }

  Alert.alert(
    "Delete Garment",
    `Are you sure you want to delete Garment ${indexToDelete + 1}?`,
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const garmentToDelete = garments[indexToDelete];

          // ✅ DELETE FROM BACKEND
          if (garmentToDelete?._id) {
            try {
              await axios.delete(
                `${BASE_URL}/api/order-details/${garmentToDelete._id}`
              );
              console.log("🗑️ Garment deleted from backend");
            } catch (err) {
              console.log("❌ Backend delete failed", err);
            }
          }

          const updated = garments.filter(
            (_, index) => index !== indexToDelete
          );

          setGarments(updated);

          // ✅ Fix active index
          if (activeGarmentIndex >= updated.length) {
            setActiveGarmentIndex(updated.length - 1);
          } else if (activeGarmentIndex > indexToDelete) {
            setActiveGarmentIndex(activeGarmentIndex - 1);
          }
        },
      },
    ]
  );
};

    // ==================== HELPERS ====================
const isEssentialComplete = () => {
  return (
    customerData.name 
  );
};
  
const calculateGarmentTotal = (garment) => {
  const basePrice = parseFloat(garment.price || 0);

  const extraTotal = garment.extraWork.reduce(
    (sum, work) => sum + parseFloat(work.amount || 0),
    0
  );

  return basePrice + extraTotal;
};
const calculateTotal = () => {
  const garmentTotal = garments.reduce((sum, g) => {
    const basePrice = parseFloat(g.price || 0);

    const extraTotal = g.extraWork.reduce(
      (s, w) => s + parseFloat(w.amount || 0),
      0
    );

    return sum + basePrice + extraTotal;
  }, 0);

  const discount = parseFloat(paymentData.discount || 0);

  return garmentTotal - discount;
};


const calculateBalance = () => {
  const total = calculateTotal();
  const advance = parseFloat(paymentData.advance || 0);
  return total - advance;
};


    // ==================== HANDLERS ====================
    const handleCustomerChange = (field, value) => {
      setCustomerData({ ...customerData, [field]: value });
    };



const handleMeasurementChange = (field, value) => {
  updateActiveGarment({
    measurements: {
      ...activeGarment.measurements,
      [field]: value,
    },
  });
};


    const handlePaymentChange = (field, value) => {
      setPaymentData({ ...paymentData, [field]: value });
    };


const toggleExtraWork = (workName) => {
  setGarments((prev) =>
    prev.map((g, index) => {
      if (index !== activeGarmentIndex) return g;

      const exists = g.extraWork.find(
        (w) => w.name === workName
      );

      return {
        ...g,
        extraWork: exists
          ? g.extraWork.filter((w) => w.name !== workName)
          : [...g.extraWork, { name: workName, amount: "" }],
      };
    })
  );
};

const updateExtraWorkAmount = (workName, value) => {
  setGarments(prev => {
    const updated = [...prev];
    const garment = updated[activeGarmentIndex];

    garment.extraWork = garment.extraWork.map(w =>
      w.name === workName ? { ...w, amount: value } : w
    );

    return updated;
  });
};

const applyMeasurementTemplate = (size) => {

  // If already selected → deselect
  if (measurementTemplate === size) {

    setMeasurementTemplate("");

    // 🔁 Revert back to customer measurements OR blank
    const m = selectedCustomer?.latest_measurements || {};

   updateActiveGarment({
 measurements: selectedCustomer
  ? {
      // 🔹 Upper Body
      shoulder: m.shoulder?.toString() || "",
      arm_length: m.arm_length?.toString() || "",
      sleeves_length: m.sleeves_length?.toString() || "",
      armhole: m.armhole?.toString() || "",
      biceps: m.biceps?.toString() || "",
      neck_size: m.neck_size?.toString() || "",
      back_neck: m.back_neck?.toString() || "",
      upper_chest: m.upper_chest?.toString() || "",
      chest: m.chest?.toString() || "",
      waist: m.waist?.toString() || "",
      waist_2: m.waist_2?.toString() || "",
      hip: m.hip?.toString() || "",
      top_length: m.top_length?.toString() || "",
      tucks: m.tucks?.toString() || "",

      // 🔹 Lower Body
      pant_length: m.pant_length?.toString() || "",
      plazo_length: m.plazo_length?.toString() || "",
      pyjama_length: m.pyjama_length?.toString() || "",
      salwar_length: m.salwar_length?.toString() || "",
      round_up_1: m.round_up_1?.toString() || "",
      round_up_2: m.round_up_2?.toString() || "",
      round_up_3: m.round_up_3?.toString() || "",
      main_round_up: m.main_round_up?.toString() || "",

      // 🔹 Other
      aster: m.aster?.toString() || "",
      dupatta: m.dupatta?.toString() || "",
    }
  : {
      // 🔹 Upper Body
      shoulder: "",
      arm_length: "",
      sleeves_length: "",
      armhole: "",
      biceps: "",
      neck_size: "",
      back_neck: "",
      upper_chest: "",
      chest: "",
      waist: "",
      waist_2: "",
      hip: "",
      top_length: "",
      tucks: "",

      // 🔹 Lower Body
      pant_length: "",
      plazo_length: "",
      pyjama_length: "",
      salwar_length: "",
      round_up_1: "",
      round_up_2: "",
      round_up_3: "",
      main_round_up: "",

      // 🔹 Other
      aster: "",
      dupatta: "",
    },
});

    return;
  }

  // Otherwise apply template
const templates = {
  S: {

    shoulder: "14",
    arms_length: "20",
    sleeves_length: "9",
    neck_size: "14",
    chest_size: "34",
    tucks_size: "1",

    waist_size: "28",
    hip_size: "36",
    top_length: "40",

    salwar: "38",
    chudidar: "38",
    skirt_length: "38",
    pant_length: "38",
    aster: "2",
    dupatta: "2.25",
  },

  M: {

    shoulder: "15",
    arms_length: "21",
    sleeves_length: "10",
    neck_size: "15",
    chest_size: "36",
    tucks_size: "1.5",

    waist_size: "30",
    hip_size: "38",
    top_length: "42",

    salwar: "40",
    chudidar: "40",
    skirt_length: "40",
    pant_length: "40",
    aster: "2.5",
    dupatta: "2.5",
  },

  L: {
   
    shoulder: "16",
    arms_length: "22",
    sleeves_length: "11",
    neck_size: "16",
    chest_size: "38",
    tucks_size: "2",

    waist_size: "32",
    hip_size: "40",
    top_length: "44",

    salwar: "42",
    chudidar: "42",
    skirt_length: "42",
    pant_length: "42",
    aster: "3",
    dupatta: "2.75",
  },
};

updateActiveGarment({
  measurements: {
    ...activeGarment.measurements,
    ...templates[size],
  },
});

setMeasurementTemplate(size);
};



 const openCamera = async () => {
  const permission = await ImagePicker.requestCameraPermissionsAsync();

  if (!permission.granted) {
    Alert.alert("Permission required", "Camera access is needed");
    return;
  }

const result = await ImagePicker.launchCameraAsync({
  mediaTypes: ['images'],
  allowsEditing: false,
  quality: 0.2, 
});

  if (!result.canceled && result.assets?.length > 0) {
    updateActiveGarment({
      clothImage: result.assets[0].uri,
    });
  }
};

 const openGallery = async () => {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    Alert.alert("Permission required", "Gallery access is needed");
    return;
  }

const result = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: ['images'],
  allowsEditing: false,
  quality: 0.2,  
});
  if (!result.canceled && result.assets?.length > 0) {
    updateActiveGarment({
      clothImage: result.assets[0].uri,
    });
  }
};


  const handleCreateCustomer = async () => {
    try {
      if (!newCustomer.first_name || !newCustomer.contact_no_1) {
        Alert.alert("Error", "Name and mobile are required");
        return;
      }

const response = await axios.post(
  `${BASE_URL}/api/customers`,
  newCustomer
);

      const createdCustomer = response.data.data;

      setCustomers((prev) => [...prev, createdCustomer]);

      setSelectedCustomer(createdCustomer);

      setCustomerData({
        name: `${createdCustomer.first_name} ${createdCustomer.last_name}`,
        careOf: "",
        mobileNo: createdCustomer.contact_no_1,
        contactNo: createdCustomer.contact_no_2 || "",
      });

      setNewCustomer({
        first_name: "",
        last_name: "",
        contact_no_1: "",
        contact_no_2: "",
        email: "",
      });

      setShowAddCustomerModal(false);

    } catch (error) {
      Alert.alert("Error", "Failed to create customer");
    }
  };




const fetchNextOrderNumber = async () => {
  try {
    const response = await axios.get(
      `${BASE_URL}/api/orders/next-number`
    );

    if (response.data && response.data.success) {
      setOrderNumber(response.data.nextOrderNo);
    }
  } catch (error) {
    console.log("Error fetching order number:", error);
  }
};


const sanitizeMeasurements = (measurements) => {
  const cleaned = {};

  Object.keys(measurements || {}).forEach((key) => {
    const value = measurements[key];

    cleaned[key] =
      value === "" || value === null || value === undefined
        ? null
        : value.toString();   
  });

  return cleaned;
};





const saveGarment = async (garment, index, currentOrderId) => {
  if (garment.isSaved) {
    console.log("⛔ Skipping already saved garment");
    return;
  }

  try {
    const formData = new FormData();

    formData.append("order_id", currentOrderId);
    formData.append("name", garment.name);
    formData.append("price", garment.price || 0);
    formData.append("delivery_date", garment.deliveryDate || "");
    formData.append("description", garment.description || "");
    formData.append("design_notes", garment.designNotes || "");

    formData.append(
      "measurements",
      JSON.stringify(sanitizeMeasurements(garment.measurements))
    );

    formData.append(
      "extraWork",
      JSON.stringify(garment.extraWork || [])
    );

    if (garment.clothImage) {
      formData.append("clothImage", {
        uri: garment.clothImage,
        name: `cloth_${index}.jpg`,
        type: "image/jpeg",
      });
    }

    if (garment.designImage) {
      formData.append("designImage", {
        uri: garment.designImage,
        name: `design_${index}.jpg`,
        type: "image/jpeg",
      });
    }

    // ✅ 1. Save garment
    const response = await axios.post(
      `${BASE_URL}/api/order-details`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    console.log("✅ Garment saved:", response.data);

const orderDetailId = response.data?.data?._id;

// ✅ store backend id + mark saved
setGarments(prev => {
  const updated = [...prev];
  if (updated[index]) {
    updated[index]._id = orderDetailId;   // 🔥 IMPORTANT
    updated[index].isSaved = true;
  }
  return updated;
});

    // ✅ 2. Create task for this garment
 if (orderDetailId) {
    await createTask(orderDetailId, garment, currentOrderId, index);
    }
  } catch (error) {
    console.log("❌ Garment save error:", error);
  }
};

const createTask = async (orderDetailId, garment, currentOrderId, index) => {
  try {
    // ✅ ONLY create tasks if extra work exists
    if (garment.extraWork && garment.extraWork.length > 0) {
      
      for (let work of garment.extraWork) {
    const payload = {
  order_id: currentOrderId,
  order_detail_id: orderDetailId,

  name: work.name,

  garment_index: index,  

  garment_id: garment._id || null,
  garment_name: garment.name || `Garment ${index + 1}`,

  status: "Pending",
  due_date: garment.deliveryDate || null,
};

        const response = await axios.post(
         `${BASE_URL}/api/task`,
          payload
        );

        console.log("✅ Task created:", response.data);
      }
    }

    // ❌ NO ELSE → no task will be created

  } catch (error) {
    console.log("❌ Task creation error:", error.response?.data || error.message);
  }
};

const buildOrderFormData = (payload, garments) => {
  const formData = new FormData();

  Object.keys(payload).forEach((key) => {
    formData.append(key, payload[key]);
  });

  

  const validGarments = garments
    .filter((g) => g && g.id)
    .map(({ clothImage, designImage, ...rest }) => rest);


  garments.forEach((g, index) => {
    if (g.clothImage) {
      formData.append("clothImages", {
        uri: g.clothImage,
        name: `cloth_${index}.jpg`,
        type: "image/jpeg",
      });
      formData.append("clothImageIndexes", String(index));
    }

    if (g.designImage) {
      formData.append("designImages", {
        uri: g.designImage,
        name: `design_${index}.jpg`,
        type: "image/jpeg",
      });
      formData.append("designImageIndexes", String(index));
    }
  });

  return formData;
};

    // ✅ Step 5: Date converter
const createOrder = async (customerOverride = null) => {
    if (orderIdRef.current) {
    console.log("⛔ createOrder blocked — already exists:", orderIdRef.current);
    return orderIdRef.current;
  }

  try {
    const customer = customerOverride || selectedCustomer;
    if (!customer) {
      console.log("❌ createOrder called with no customer");
      return null;
    }
    const payload = {
      customer_id: customer._id,
      customer_name: `${customer.first_name} ${customer.last_name}`,
      care_of: customer.care_of || "",
      contact_no_1: customer.contact_no_1 || "",
      contact_no_2: customer.contact_no_2 || "",
  order_date: convertToISO(orderData.orderDate),

  total: calculateTotal(),
  discount: parseFloat(paymentData.discount || 0),
paid_amount: 0,
received_amount: 0,
  payment_method: paymentData.method,
  balance: calculateBalance(),
  notes: paymentData.notes,

status: Number(paymentData.advance || 0) > 0 ? "Pending" : "Draft",
};
console.log("FINAL UPDATE PAYLOAD:", payload); 

    const response = await axios.post(
      `${BASE_URL}/api/orders`,
      payload
    );

   if (response.data?.success) {
  const id = response.data.data._id;
  setOrderId(id);
  orderIdRef.current = id; 
  console.log("✅ Order created:", id);
  return id;
}
  } catch (error) {
    console.log("Create order error:", error);
    return null;
  }
};

const deleteOrder = async () => {
  if (!orderIdRef.current || isSaved) return;

  try {
    await axios.delete(
      `${BASE_URL}/api/orders/${orderIdRef.current}`
    );

    console.log("🗑️ Draft order deleted:", orderIdRef.current);

    orderIdRef.current = null;
    setOrderId(null);

  } catch (error) {
    console.log("❌ Delete order failed:", error.response?.data);
  }
};
    
    const convertToISO = (dateString) => {
      if (!dateString) return null;
      const [day, month, year] = dateString.split("/");
      return new Date(`${year}-${month}-${day}`).toISOString();
    };

const handleSubmit = async () => {
  if (creatingOrder || submittingRef.current) return;

  submittingRef.current = true;
  setCreatingOrder(true);

  try {
    const advanceAmount = parseFloat(paymentData.advance || 0);

    // Step 1: Capture drawing
    const updatedGarments = await saveCurrentDesignImage();

    // Step 2: Ensure order exists
    let currentOrderId = orderIdRef.current;
    if (!currentOrderId) {
      currentOrderId = await createOrder();
    }

    if (!currentOrderId) {
      Alert.alert("Error", "Failed to create order. Please try again.");
      setCreatingOrder(false);
      submittingRef.current = false;
      return;
    }

    // Step 3: Save all garments
    for (let i = 0; i < updatedGarments.length; i++) {
      await saveGarment(updatedGarments[i], i, currentOrderId);
    }

    // Step 4: Validate customer
    if (!selectedCustomer) {
      Alert.alert("Error", "Please select a customer");
      setCreatingOrder(false);
      submittingRef.current = false;
      return;
    }

    // Step 5: Final payload
    const payload = {
      customer_id: selectedCustomer._id,
      customer_name: customerData.name,
      care_of: customerData.careOf || "",
      contact_no_1: customerData.mobileNo || "",
      contact_no_2: customerData.contactNo,
      order_date: convertToISO(orderData.orderDate),
      total: calculateTotal(),
      discount: parseFloat(paymentData.discount || 0),
      paid_amount: advanceAmount,
      initial_advance: advanceAmount,
received_amount: advanceAmount,
      payment_method: paymentData.method,
      balance: calculateBalance(),
      notes: paymentData.notes,
      status: "Pending",
    };

    // Step 6: Update order
    const response = await axios.put(
      `${BASE_URL}/api/orders/${currentOrderId}`,
      payload,
      {
        headers: { "Content-Type": "application/json" },
        timeout: 120000,
      }
    );

    if (response.data?.success) {

      // Step 7: Create receipt ONLY if advance > 0 and not already created
      if (advanceAmount > 0 && !receiptCreatedRef.current) {
        receiptCreatedRef.current = true;
        try {
          await axios.post(`${BASE_URL}/api/receipt`, {
            orders: [
              {
                order_id: currentOrderId,
                applied_amount: advanceAmount,
              },
            ],
            total_amount: advanceAmount,
            payment_mode: paymentData.method || "Cash",
            receipt_date: new Date(),
          });
          console.log("✅ Receipt created for amount:", advanceAmount);
        } catch (err) {
          receiptCreatedRef.current = false;
          console.log("❌ Receipt creation failed:", err.response?.data);
        }
      }

      Alert.alert("Success", "Order created successfully!", [
        {
          text: "OK",
          onPress: () => {
            submittingRef.current = false;
            receiptCreatedRef.current = false;
            setIsSaved(true);
            orderIdRef.current = null;
            setOrderId(null);
            setCustomerData({ name: "", careOf: "", mobileNo: "", contactNo: "" });
            setOrderData({ orderDate: new Date().toLocaleDateString("en-GB") });
            setGarments([{
              id: Date.now(),
              name: "Garment 1",
              isSaved: false,
              extraWork: [],
              deliveryDate: "",
              clothImage: null,
              designPaths: [],
              price: "",
              measurements: {},
            }]);
            setActiveGarmentIndex(0);
            setPaymentData({ advance: "", notes: "", discount: "", method: "" });
            fetchNextOrderNumber();
            setCreatingOrder(false);
          },
        },
      ]);
    }
  } catch (error) {
    setCreatingOrder(false);
    submittingRef.current = false;

    const logs = [];
    const pushLog = (title, data) => {
      logs.push({ title, data: typeof data === "string" ? data : JSON.stringify(data, null, 2) });
    };
    pushLog("❌ ERROR MESSAGE", error.message);
    pushLog("❌ STATUS", error.response?.status);
    pushLog("❌ RESPONSE DATA", error.response?.data);
    if (error.request) pushLog("📡 NO RESPONSE", "Request sent but no response");
    if (error.config) pushLog("📤 REQUEST URL", error.config.url);
    openDebug(logs);
  }
};



  const convertToDate = (dateString) => {
    if (!dateString) return null;
    const [day, month, year] = dateString.split("/");
    return new Date(`${year}-${month}-${day}`);
  };


useEffect(() => {
  if (token) {
    fetchCustomers("");
  }
}, [token]);

useEffect(() => {
  setIsSaved(false);
}, [customerData, garments, paymentData]);

const confirmLeave = (callback) => {
  if (isSaved) {
    callback();
    return;
  }

  const hasData =
    customerData.name?.trim() ||
    customerData.mobileNo?.trim() ||
    orderIdRef.current ||    // ✅ order already created in DB
    garments.some(g =>
      g.price ||
      g.deliveryDate ||
      g.extraWork.length > 0 ||
      g.designPaths?.length > 0 ||
      g.designNotes?.trim() ||
      g.description?.trim()
    ) ||
    paymentData.advance ||
    paymentData.discount;

  if (!hasData) {
    callback();
    return;
  }

  Alert.alert(
    "Discard changes?",
    "You have unsaved changes. Going back will delete this order.",
    [
      { text: "Stay", style: "cancel" },
      {
        text: "Discard",
        style: "destructive",
        onPress: async () => {
          await deleteOrder();
          callback();
        },
      },
    ]
  );
};

const hasUnsavedChanges = () => {
  return (
    customerData.name?.trim() ||
    customerData.mobileNo?.trim() ||
    garments.some(g =>
      g.price ||
      g.deliveryDate ||
      g.extraWork.length > 0 ||
      g.designPaths?.length > 0 ||
      g.designNotes?.trim() ||
      g.description?.trim()
    ) ||
    paymentData.advance ||
    paymentData.discount
  );
};


useEffect(() => {
  const backAction = () => {
    // ✅ Always intercept the back button — never let it pass through
    if (isSaved) {
      goToOrders();
      return true;
    }

    // ✅ Show confirmation if any order was created OR any data entered
    const hasData = 
      customerData.name?.trim() ||
      customerData.mobileNo?.trim() ||
      orderIdRef.current ||   // order already created in DB
      garments.some(g =>
        g.price ||
        g.deliveryDate ||
        g.extraWork.length > 0 ||
        g.designPaths?.length > 0 ||
        g.designNotes?.trim() ||
        g.description?.trim()
      ) ||
      paymentData.advance ||
      paymentData.discount;

    if (!hasData) {
      goToOrders();
      return true;
    }

    Alert.alert(
      "Discard changes?",
      "You have unsaved changes. Going back will delete this order.",
      [
        { text: "Stay", style: "cancel" },
        {
          text: "Discard",
          style: "destructive",
          onPress: async () => {
            await deleteOrder();
            goToOrders();
          },
        },
      ]
    );

    return true; // ✅ always return true to block default back
  };

  const backHandler = BackHandler.addEventListener(
    "hardwareBackPress",
    backAction
  );

  return () => backHandler.remove();
}, [isSaved, customerData, garments, paymentData, orderIdRef.current]);


useEffect(() => {
  if (setLeaveHandler) {
    setLeaveHandler(() => confirmLeave);
  }

  return () => {
    setLeaveHandler(null);
  };
}, [isSaved, customerData, garments, paymentData]);


// ✅ PREFILL STATE IF EDITING
useEffect(() => {
  if (!editOrder) return;

  // Set order ID so we PUT instead of POST
  orderIdRef.current = editOrder._id;
  setOrderId(editOrder._id);
  setIsSaved(false);

  // Customer
  setSelectedCustomer(editOrder.customer_id || { _id: editOrder.customer_id });
  setCustomerData({
    name: editOrder.customer_name || "",
    careOf: editOrder.care_of || "",
    mobileNo: editOrder.contact_no_1 || "",
    contactNo: editOrder.contact_no_2 || "",
  });

  // Order date
  if (editOrder.order_date) {
    setOrderData({
      orderDate: new Date(editOrder.order_date).toLocaleDateString("en-GB"),
    });
  }

  // Payment
  setPaymentData({
    advance: editOrder.received_amount?.toString() || "",
    discount: editOrder.discount?.toString() || "",
    method: editOrder.payment_method || "",
    notes: editOrder.notes || "",
  });

  // Garments
  if (editOrder.garments?.length > 0) {
    const prefilled = editOrder.garments.map((g, i) => ({
      id: g._id || Date.now() + i,
      _id: g._id,           // ✅ keep DB id
      isSaved: true,        // ✅ don't re-save on submit
      name: g.name || `Garment ${i + 1}`,
      price: g.price?.toString() || "",
      deliveryDate: g.delivery_date
        ? new Date(g.delivery_date).toLocaleDateString("en-GB")
        : "",
      clothImage: g.clothImage || null,
      designImage: g.designImage || null,
      designPaths: [],
      designNotes: g.design_notes || g.designNotes || "",
      description: g.description || "",
      extraWork: g.extraWork || [],
measurements: {
  // 🔹 Upper Body
  shoulder: g.measurements?.shoulder?.toString() || "",
  arm_length: g.measurements?.arm_length?.toString() || "",
  sleeves_length: g.measurements?.sleeves_length?.toString() || "",
  armhole: g.measurements?.armhole?.toString() || "",
  biceps: g.measurements?.biceps?.toString() || "",
  neck_size: g.measurements?.neck_size?.toString() || "",
  back_neck: g.measurements?.back_neck?.toString() || "",
  upper_chest: g.measurements?.upper_chest?.toString() || "",
  chest: g.measurements?.chest?.toString() || "",
  waist: g.measurements?.waist?.toString() || "",
  waist_2: g.measurements?.waist_2?.toString() || "",
  hip: g.measurements?.hip?.toString() || "",
  top_length: g.measurements?.top_length?.toString() || "",
  tucks: g.measurements?.tucks?.toString() || "",

  // 🔹 Lower Body
  pant_length: g.measurements?.pant_length?.toString() || "",
  plazo_length: g.measurements?.plazo_length?.toString() || "",
  pyjama_length: g.measurements?.pyjama_length?.toString() || "",
  salwar_length: g.measurements?.salwar_length?.toString() || "",
  round_up_1: g.measurements?.round_up_1?.toString() || "",
  round_up_2: g.measurements?.round_up_2?.toString() || "",
  round_up_3: g.measurements?.round_up_3?.toString() || "",
  main_round_up: g.measurements?.main_round_up?.toString() || "",

  // 🔹 Other
  aster: g.measurements?.aster?.toString() || "",
  dupatta: g.measurements?.dupatta?.toString() || "",
},
    }));
    setGarments(prefilled);
  }

  // Pre-fetch order number (show existing)
  setOrderNumber(editOrder.order_no || "");

}, [editOrder]);



    // ==================== RENDER ====================
    return (
     <SafeAreaView style={styles.safeArea}>
<KeyboardAvoidingView
  style={{ flex: 1 }}
  behavior={Platform.OS === "ios" ? "padding" : "height"}
  keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
>

    <View style={styles.container}>

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>New Order</Text>
              <Text style={styles.headerSubtitle}>
{orderNumber}
              </Text>
            </View>
          
          </View>

<ScrollView
  ref={scrollRef}
  style={styles.scrollView}
  showsVerticalScrollIndicator={false}
  keyboardShouldPersistTaps="handled"
  keyboardDismissMode="interactive"
  contentContainerStyle={{
    paddingBottom: 120,
    flexGrow: 1
  }}
>


<View style={styles.garmentTabs}>
  {garments.map((g, index) => {
    const isActive = activeGarmentIndex === index;

    return (
      <TouchableOpacity
        key={g.id}
        style={[
          styles.garmentTab,
          isActive && styles.garmentTabActive,
        ]}
onPress={async () => {
  await saveCurrentDesignImage();
  setActiveGarmentIndex(index);
}}     onLongPress={() => {
          if (garments.length > 1) {
            deleteGarment(index);
          }
        }}
        delayLongPress={400}
      >
        <Text
          style={[
            styles.garmentTabText,
            isActive && styles.garmentTabTextActive,
          ]}
        >
          Garment {index + 1}
        </Text>
      </TouchableOpacity>
    );
  })}
</View>


            {/* SECTION 1: ESSENTIAL INFO (Collapsible) */}
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.sectionHeaderCollapsible}
                onPress={() => setEssentialExpanded(!essentialExpanded)}
              >
                <View style={styles.sectionHeader}>
                  <View style={styles.stepBadge}>
                    <Text style={styles.stepNumber}>1</Text>
                  </View>
                  <Text style={styles.sectionTitle}>Essential Information</Text>
                  <Text style={styles.requiredBadge}>Required</Text>
                </View>
                <Text style={styles.expandIcon}>{essentialExpanded ? "▼" : "▶"}</Text>
              </TouchableOpacity>

              {essentialExpanded && (
                <>
        <View style={styles.rowInputs}>

  {/* Customer Name */}
  <View style={[styles.inputGroup, { flex: 1 }]}>
    <Text style={styles.label}>
      Customer Name <Text style={styles.required}>*</Text>
    </Text>

    <TouchableOpacity
      style={styles.input}
      onPress={() => {
        setCustomerSelectMode("main");
        setShowCustomerModal(true);
      }}
    >
      <Text style={{ color: selectedCustomer ? "#0F172A" : "#94A3B8" }}>
        {selectedCustomer
          ? `${selectedCustomer.first_name} ${selectedCustomer.last_name}`
          : "Select Customer"}
      </Text>
    </TouchableOpacity>
  </View>

  {/* Contact Number */}
  <View style={[styles.inputGroup, { flex: 1 }]}>
    <Text style={styles.label}>
      Contact Number 
    </Text>

    <TextInput
      style={[
        styles.disabledInput,
        selectedCustomer && styles.inputDisabled
      ]}
      value={customerData.mobileNo}
      editable={!selectedCustomer}
      placeholder="+91 XXXXX XXXXX"
      placeholderTextColor="#94A3B8"
      keyboardType="phone-pad"
    />
  </View>

</View>

 <View style={styles.rowInputs}>

{/* C/O */}
<View style={[styles.inputGroup, { flex: 1 }]}>
  <Text style={styles.label}>C/O</Text>

  <TextInput
    style={styles.input}
    value={customerData.careOf}
    onChangeText={(value) =>
      setCustomerData((prev) => ({
        ...prev,
        careOf: value,
      }))
    }
    placeholder="Enter C/O"
    placeholderTextColor="#94A3B8"
  />
</View>

  {/* Alternate Number */}
  <View style={[styles.inputGroup, { flex: 1 }]}>
    <Text style={styles.label}>Alternate Number</Text>

    <TextInput
      style={styles.input}
      value={customerData.contactNo}
      onChangeText={(value) =>
        handleCustomerChange("contactNo", value)
      }
      placeholder="+91 XXXXX XXXXX"
      placeholderTextColor="#94A3B8"
      keyboardType="phone-pad"
    />
  </View>

</View>

                  <View style={styles.rowInputs}>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.label}>Order Date</Text>
                      <View style={styles.disabledInput}>
                        <Text style={styles.disabledText}>{orderData.orderDate}</Text>
                      </View>
                    </View>

                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.label}>
                        Delivery Date 
                      </Text>
                    <TouchableOpacity
    style={styles.input}
    onPress={() => setShowDeliveryPicker(true)}
  >
<Text style={{ color: activeGarment.deliveryDate ? "#0F172A" : "#94A3B8" }}>
  {activeGarment.deliveryDate || "Select Date"}
</Text>

  </TouchableOpacity>

  {showDeliveryPicker && (
    <DateTimePicker
value={
  activeGarment.deliveryDate
    ? new Date(
        activeGarment.deliveryDate.split("/").reverse().join("-")
      )
    : new Date()
}

      mode="date"
      display="default"
      onChange={(event, selectedDate) => {
        setShowDeliveryPicker(false);
        if (selectedDate) {
          const formattedDate = selectedDate
            .toLocaleDateString("en-GB");
         updateActiveGarment({
  deliveryDate: formattedDate,
});

        }
      }}
    />
  )}

                    </View>
                  </View>

             
                </>
              )}
            </View>


   {/* SECTION 2: DESIGN & PAINT (Collapsible) */}
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.sectionHeaderCollapsible}
                onPress={() => setDesignExpanded(!designExpanded)}
              >
                <View style={styles.sectionHeader}>
                  <View style={styles.stepBadge}>
                    <Text style={styles.stepNumber}>2</Text>
                  </View>
                  <Text style={styles.sectionTitle}>Design & Paint</Text>
                  <Text style={styles.optionalBadge}>Optional</Text>
                </View>
                <Text style={styles.expandIcon}>{designExpanded ? "▼" : "▶"}</Text>
              </TouchableOpacity>

              {designExpanded && (
                <>
                  {/* Image Upload Section */}
                  <View style={styles.designSubSection}>
                    <Text style={styles.subSectionTitle}>📸 Cloth Reference</Text>
                    <View style={styles.imageButtonRow}>
                      <TouchableOpacity style={styles.imageButton} onPress={openCamera}>
                        <Text style={styles.imageButtonText}>📷 Camera</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.imageButton} onPress={openGallery}>
                        <Text style={styles.imageButtonText}>🖼️ Gallery</Text>
                      </TouchableOpacity>
                    </View>

                  {activeGarment.clothImage && (
  <View style={styles.imagePreview}>
    <Image
      source={{
       uri: activeGarment.clothImage
      }}
      style={styles.previewImage}
    />

    {activeGarment.designImage && (
  <Image
    source={{ uri: activeGarment.designImage }}
    style={styles.previewImage}
  />
)}

    <TouchableOpacity
      style={styles.removeImageButton}
      onPress={() => updateActiveGarment({ clothImage: null })}
    >
      <Text style={styles.removeImageText}>✕</Text>
    </TouchableOpacity>
  </View>
)}

                    
                  </View>

                  {/* Paint/Drawing Section */}
                  
                  <View style={styles.designSubSection}>
                    <Text style={styles.subSectionTitle}>🎨 Design Sketch</Text>
                    
                    {/* Drawing Tools */}
                    <View style={styles.paintToolbar}>
                   <View style={styles.toolGroup}>

  <TouchableOpacity
    style={[
      styles.toolButton,
      selectedTool === "pen" && styles.toolButtonActive,
    ]}
    onPress={() => setSelectedTool("pen")}
  >
    <Text style={styles.toolIcon}>✏️</Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={[
      styles.toolButton,
      selectedTool === "eraser" && styles.toolButtonActive,
    ]}
    onPress={() => setSelectedTool("eraser")}
  >
    <Text style={styles.toolIcon}>🧹</Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={styles.toolButton}
    onPress={handleUndo}
  >
    <Text style={styles.toolIcon}>↩️</Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={styles.toolButton}
    onPress={handleRedo}
  >
    <Text style={styles.toolIcon}>↪️</Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={styles.toolButton}
    onPress={handleClear}
  >
    <Text style={styles.toolIcon}>🗑️</Text>
  </TouchableOpacity>

</View>

                      <View style={styles.toolDivider} />

                      {/* Color Palette */}
                      <View style={styles.toolGroup}>
                        {["#1A1A1A", "#EF4444", "#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#FFFFFF"].map(
                          (color) => (
                            <TouchableOpacity
                              key={color}
                              style={[
                                styles.colorButton,
                                { backgroundColor: color },
                                selectedColor === color && styles.colorButtonActive,
                                color === "#FFFFFF" && styles.colorButtonWhite,
                              ]}
                              onPress={() => {
                                setSelectedColor(color);
                                setSelectedTool("pen");
                              }}
                            />
                          )
                        )}
                      </View>

                      <View style={styles.toolDivider} />

                      {/* Brush Sizes */}
                      <View style={styles.toolGroup}>
                        {[2, 4, 6, 8].map((size) => (
                          <TouchableOpacity
                            key={size}
                            style={[
                              styles.brushButton,
                              brushSize === size && styles.toolButtonActive,
                            ]}
                            onPress={() => setBrushSize(size)}
                          >
                            <View
                              style={{
                                width: size * 1.5,
                                height: size * 1.5,
                                backgroundColor: brushSize === size ? "#FFFFFF" : "#64748B",
                                borderRadius: 50,
                              }}
                            />
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>


<ViewShot
  ref={viewShotRef}
 options={{
  format: "jpg",
quality: 0.15,
  result: "tmpfile",
}}
>
  <DrawingCanvas
    selectedColor={selectedColor}
    brushSize={brushSize}
    selectedTool={selectedTool}
    paths={activeGarment.designPaths || []}
    setPaths={(updater) => {
      setGarments(prevGarments => {
        const updated = [...prevGarments];
        const index = activeIndexRef.current;
        if (!updated[index]) return prevGarments;

        const prevPaths = updated[index].designPaths || [];

        const newPaths =
          typeof updater === "function"
            ? updater(prevPaths)
            : updater;

        updated[index] = {
          ...updated[index],
          designPaths: newPaths,
        };

        return updated;
      });
    }}
  />
</ViewShot>


                  </View>

                  {/* Design Notes */}
                  <View style={styles.designSubSection}>
                    <Text style={styles.subSectionTitle}>📝 Design Notes</Text>
                   <TextInput
  style={[styles.input, styles.textArea]}
  value={activeGarment.designNotes || ""}
  onChangeText={(value) =>
    updateActiveGarment({ designNotes: value })
  }
                     
                      placeholder="Add design specifications, fabric details, embroidery notes, etc."
                      placeholderTextColor="#94A3B8"
                      multiline
                      numberOfLines={4}
                    />
                  </View>
                </>
              )}
            </View>


            {/* SECTION 3: MEASUREMENTS (Collapsible) */}
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.sectionHeaderCollapsible}
                onPress={() => setMeasurementsExpanded(!measurementsExpanded)}
              >
                <View style={styles.sectionHeader}>
                  <View style={[styles.stepBadge, isEssentialComplete() && styles.stepBadgeActive]}>
                    <Text style={[styles.stepNumber, isEssentialComplete() && styles.stepNumberActive]}>3</Text>
                  </View>
                  <Text style={styles.sectionTitle}>Measurements</Text>
                  <Text style={styles.optionalBadge}>Optional</Text>
                </View>
                <Text style={styles.expandIcon}>{measurementsExpanded ? "▼" : "▶"}</Text>
              </TouchableOpacity>

              {measurementsExpanded && (
                <>
                  {/* Quick Templates */}
                  {/* <View style={styles.templateRow}>
                    <Text style={styles.templateLabel}>Quick Select:</Text>
                    {["S", "M", "L"].map((size) => (
                      <TouchableOpacity
                        key={size}
                        style={[
                          styles.templateButton,
                          measurementTemplate === size && styles.templateButtonActive,
                        ]}
                        onPress={() => applyMeasurementTemplate(size)}
                      >
                        <Text
                          style={[
                            styles.templateButtonText,
                            measurementTemplate === size && styles.templateButtonTextActive,
                          ]}
                        >
                          {size}
                        </Text>
                      </TouchableOpacity>
                    ))}
              
                  </View> */}

       {/* Measurement Groups */}
{/* 🔹 Upper Body */}
<View style={styles.measurementGroup}>
  <Text style={styles.measurementGroupTitle}>Upper Body</Text>

  <View style={styles.measurementRow}>
    <MeasurementInput
      label="Shoulder"
      value={activeGarment.measurements.shoulder}
      onChange={(v) => handleMeasurementChange("shoulder", v)}
    />
    <MeasurementInput
      label="Neck Size"
      value={activeGarment.measurements.neck_size}
      onChange={(v) => handleMeasurementChange("neck_size", v)}
    />
      <MeasurementInput
      label="Back Neck"
      value={activeGarment.measurements.back_neck}
      onChange={(v) => handleMeasurementChange("back_neck", v)}
    />
  </View>

  <View style={styles.measurementRow}>
   <MeasurementInput
      label="Chest"
      value={activeGarment.measurements.chest}
      onChange={(v) => handleMeasurementChange("chest", v)}
    />
    <MeasurementInput
      label="Upper Chest"
      value={activeGarment.measurements.upper_chest}
      onChange={(v) => handleMeasurementChange("upper_chest", v)}
    />
     <MeasurementInput
      label="Biceps"
      value={activeGarment.measurements.biceps}
      onChange={(v) => handleMeasurementChange("biceps", v)}
    />
  </View>

  <View style={styles.measurementRow}>
   
    <MeasurementInput
      label="Arm Length"
      value={activeGarment.measurements.arm_length}
      onChange={(v) => handleMeasurementChange("arm_length", v)}
    />
     <MeasurementInput
      label="Sleeves Length"
      value={activeGarment.measurements.sleeves_length}
      onChange={(v) => handleMeasurementChange("sleeves_length", v)}
    />
    <MeasurementInput
      label="Armhole"
      value={activeGarment.measurements.armhole}
      onChange={(v) => handleMeasurementChange("armhole", v)}
    />
  </View>



  <View style={styles.measurementRow}>
     <MeasurementInput
      label="Waist"
      value={activeGarment.measurements.waist}
      onChange={(v) => handleMeasurementChange("waist", v)}
    />
    <MeasurementInput
      label="Waist 2"
      value={activeGarment.measurements.waist_2}
      onChange={(v) => handleMeasurementChange("waist_2", v)}
    />
    <MeasurementInput
      label="Hip"
      value={activeGarment.measurements.hip}
      onChange={(v) => handleMeasurementChange("hip", v)}
    />
  </View>

<View style={styles.measurementRow}>
  <MeasurementInput
    label="Top Length"
    value={activeGarment.measurements.top_length}
    onChange={(v) => handleMeasurementChange("top_length", v)}
  />

  <MeasurementInput
    label="Tucks"
    value={activeGarment.measurements.tucks}
    onChange={(v) => handleMeasurementChange("tucks", v)}
  />

  {/* Empty space to maintain layout */}
  <View style={{ width: "30%" }} />
</View>
</View>

{/* 🔹 Lower Body */}
<View style={styles.measurementGroup}>
  <Text style={styles.measurementGroupTitle}>Lower Body</Text>

  <View style={styles.measurementRow}>
    <MeasurementInput
      label="Pant Length"
      value={activeGarment.measurements.pant_length}
      onChange={(v) => handleMeasurementChange("pant_length", v)}
    />
    <MeasurementInput
      label="Plazo Length"
      value={activeGarment.measurements.plazo_length}
      onChange={(v) => handleMeasurementChange("plazo_length", v)}
    />
     <MeasurementInput
      label="Pyjama Length"
      value={activeGarment.measurements.pyjama_length}
      onChange={(v) => handleMeasurementChange("pyjama_length", v)}
    />
  </View>

  <View style={styles.measurementRow}>
   
    <MeasurementInput
      label="Salwar Length"
      value={activeGarment.measurements.salwar_length}
      onChange={(v) => handleMeasurementChange("salwar_length", v)}
    />
     
  </View>

  <View style={styles.measurementRow}>
  
   <MeasurementInput
      label="Round Up 1"
      value={activeGarment.measurements.round_up_1}
      onChange={(v) => handleMeasurementChange("round_up_1", v)}
    />
    <MeasurementInput
      label="Round Up 2"
      value={activeGarment.measurements.round_up_2}
      onChange={(v) => handleMeasurementChange("round_up_2", v)}
    />
        <MeasurementInput
      label="Round Up 3"
      value={activeGarment.measurements.round_up_3}
      onChange={(v) => handleMeasurementChange("round_up_3", v)}
    />
  </View>

  <View style={styles.measurementRow}>

    <MeasurementInput
      label="Main Round Up"
      value={activeGarment.measurements.main_round_up}
      onChange={(v) => handleMeasurementChange("main_round_up", v)}
    />
  </View>
</View>

{/* 🔹 Other */}
<View style={styles.measurementGroup}>
  <Text style={styles.measurementGroupTitle}>Other</Text>

  <View style={styles.measurementRow}>
    <MeasurementInput
      label="Aster"
      value={activeGarment.measurements.aster}
      onChange={(v) => handleMeasurementChange("aster", v)}
    />
    <MeasurementInput
      label="Dupatta"
      value={activeGarment.measurements.dupatta}
      onChange={(v) => handleMeasurementChange("dupatta", v)}
    />
      {/* Empty space to maintain layout */}
  <View style={{ width: "30%" }} />
  </View>
</View>
                </>
              )}
            </View>


      {/* SECTION 4: WORK DETAILS (Collapsible) */}
  <View style={styles.section}>
    <TouchableOpacity
      style={styles.sectionHeaderCollapsible}
      onPress={() => setWorkDetailsExpanded(!workDetailsExpanded)}
    >
      <View style={styles.sectionHeader}>
        <View style={[styles.stepBadge, isEssentialComplete() && styles.stepBadgeActive]}>
          <Text style={[styles.stepNumber, isEssentialComplete() && styles.stepNumberActive]}>
            4
          </Text>
        </View>
        <Text style={styles.sectionTitle}>Work Details</Text>
        {activeGarment.extraWork.length > 0 && (
        <View style={styles.countBadge}>
  <Text style={styles.countBadgeText}>
    ₹{calculateTotal().toFixed(0)}
  </Text>
</View>
        )}
      </View>
      <Text style={styles.expandIcon}>
        {workDetailsExpanded ? "▼" : "▶"}
      </Text>
    </TouchableOpacity>

    {workDetailsExpanded && (
      <View style={styles.inlineExtraWorkGrid}>
        {[
          { name: "Stitching",          icon: "🪡" },
          { name: "Cutting",                icon: "✂️" },
          { name: "Cloth",              icon: "🧵" },
          { name: "Lace",               icon: "🎀" },
  { name: "Hemming",            icon: "✂️" }, 
          { name: "Ironing",            icon: "👔" },
          { name: "Handwork",           icon: "🤝" },
          { name: "Machine Work",       icon: "⚙️" },
          { name: "HP",                 icon: "💎" },
          { name: "Fabric Sourcing",    icon: "🏪" },
          { name: "Accessory Sourcing", icon: "🛍️" },
          { name: "Roll Press",         icon: "🔄" },
          { name: "Dyeing",             icon: "🎨" },
          { name: "Latkans",            icon: "🌺" },
        ].map((work) => {
          const selected = activeGarment.extraWork?.find(
            (w) => w.name === work.name
          );

          return (
            <View key={work.name} style={styles.inlineCardWrapper}>
            <TouchableOpacity
  style={[styles.inlineCard, selected && styles.inlineCardSelected]}
  onPress={() => toggleExtraWork(work.name)}
  activeOpacity={0.75}
>
  {selected && (
    <View style={styles.tick}>
      <Text style={styles.tickText}>✓</Text>
    </View>
  )}

  {/* Icon + Label always on one line */}
  <View style={styles.cardInnerRow}>
    <Text style={styles.cardIcon}>{work.icon}</Text>
<Text
  numberOfLines={1}
  style={[styles.cardLabel, selected && styles.cardLabelSelected]}
>
  {work.name}
</Text>
  </View>

  {/* Amount input below, only when selected */}
  {selected && (
    <View style={styles.amountRow}>
      <Text style={styles.rupee}>₹</Text>
      <TextInput
        style={styles.amountInput}
        value={selected.amount}
        onChangeText={(v) => updateExtraWorkAmount(work.name, v)}
        keyboardType="decimal-pad"
        placeholder="0"
        placeholderTextColor="#93C5FD"
        returnKeyType="done"
      />
    </View>
  )}
</TouchableOpacity>
            </View>
          );
        })}
      </View>
    )}
  </View>


{/* SECTION 5: GARMENT DESCRIPTION (Collapsible) */}
<View style={styles.section}>
  <TouchableOpacity
    style={styles.sectionHeaderCollapsible}
    onPress={() => setDescriptionExpanded(!descriptionExpanded)}
  >
    <View style={styles.sectionHeader}>
      <View style={styles.stepBadge}>
        <Text style={styles.stepNumber}>5</Text>
      </View>
      <Text style={styles.sectionTitle}>Garment Description</Text>

      {activeGarment.description ? (
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>Added</Text>
        </View>
      ) : (
        <Text style={styles.optionalBadge}>Optional</Text>
      )}
    </View>

    <Text style={styles.expandIcon}>
      {descriptionExpanded ? "▼" : "▶"}
    </Text>
  </TouchableOpacity>

  {descriptionExpanded && (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={activeGarment.description || ""}
        onChangeText={(value) =>
          updateActiveGarment({ description: value })
        }
        placeholder="Add stitching instructions, special requests, remarks..."
        placeholderTextColor="#94A3B8"
        multiline
        numberOfLines={4}
      />
    </View>
  )}
</View>

<View style={styles.addGarmentWrapper}>
  <TouchableOpacity
    style={styles.addGarmentBtn}
    activeOpacity={0.85}
onPress={async () => {

  if (isAddingGarment) return; // 🚫 double protection

  setIsAddingGarment(true);

  try {

    const updatedGarments = await saveCurrentDesignImage();

    let currentOrderId = orderIdRef.current;
    if (!currentOrderId) {
      currentOrderId = await createOrder();
    }

    const currentGarment = updatedGarments[activeGarmentIndex];

    await saveGarment(currentGarment, activeGarmentIndex, currentOrderId);

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}

    const customerMeasurements = selectedCustomer?.latest_measurements || {};

    const newGarment = {
      isSaved: false,
      id: Date.now(),
      name: `Garment ${garments.length + 1}`,
      extraWork: [],
      clothImage: null,
      price: "",
      designPaths: [],
      designNotes: "",
      deliveryDate: "",
      measurements: {
        shoulder: customerMeasurements.shoulder?.toString() || "",
        arm_length: customerMeasurements.arm_length?.toString() || "",
        sleeves_length: customerMeasurements.sleeves_length?.toString() || "",
        armhole: customerMeasurements.armhole?.toString() || "",
        biceps: customerMeasurements.biceps?.toString() || "",
        neck_size: customerMeasurements.neck_size?.toString() || "",
        back_neck: customerMeasurements.back_neck?.toString() || "",
        upper_chest: customerMeasurements.upper_chest?.toString() || "",
        chest: customerMeasurements.chest?.toString() || "",
        waist: customerMeasurements.waist?.toString() || "",
        waist_2: customerMeasurements.waist_2?.toString() || "",
        hip: customerMeasurements.hip?.toString() || "",
        top_length: customerMeasurements.top_length?.toString() || "",
        tucks: customerMeasurements.tucks?.toString() || "",
        pant_length: customerMeasurements.pant_length?.toString() || "",
        plazo_length: customerMeasurements.plazo_length?.toString() || "",
        pyjama_length: customerMeasurements.pyjama_length?.toString() || "",
        salwar_length: customerMeasurements.salwar_length?.toString() || "",
        round_up_1: customerMeasurements.round_up_1?.toString() || "",
        round_up_2: customerMeasurements.round_up_2?.toString() || "",
        round_up_3: customerMeasurements.round_up_3?.toString() || "",
        main_round_up: customerMeasurements.main_round_up?.toString() || "",
        aster: customerMeasurements.aster?.toString() || "",
        dupatta: customerMeasurements.dupatta?.toString() || "",
      },
    };

    setGarments(prev => {
      const updated = [...prev, newGarment];
      setActiveGarmentIndex(updated.length - 1);
      return updated;
    });

    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }, 150);

    setMeasurementTemplate("");
    setWorkDetailsExpanded(false);
    setMeasurementsExpanded(false);

  } finally {
    setIsAddingGarment(false); // 🔓 ALWAYS RELEASE
  }
}}
  >
    <Text style={styles.addGarmentIcon}>＋</Text>
<Text style={styles.addGarmentText}>
  {isAddingGarment ? "Adding..." : "Add Garment"}
</Text> 
 </TouchableOpacity>
</View>


            {/* SECTION 5: PAYMENT (Collapsible) */}
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.sectionHeaderCollapsible}
                onPress={() => setPaymentExpanded(!paymentExpanded)}
              >
                <View style={styles.sectionHeader}>
                  <View style={[styles.stepBadge, isEssentialComplete() && styles.stepBadgeActive]}>
                    <Text style={[styles.stepNumber, isEssentialComplete() && styles.stepNumberActive]}>6</Text>
                  </View>
                  <Text style={styles.sectionTitle}>Payment</Text>
                  {paymentData.total && (
                    <View style={styles.countBadge}>
                      <Text style={styles.countBadgeText}>₹{paymentData.total}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.expandIcon}>{paymentExpanded ? "▼" : "▶"}</Text>
              </TouchableOpacity>

              {paymentExpanded && (
                <>
               {/* Garment Pricing */}
<View style={styles.inputGroup}>
  <Text style={styles.label}>Garment Pricing</Text>

  {garments.map((garment, index) => (
    <View key={garment.id} style={styles.garmentPriceRow}>
      <Text style={styles.garmentPriceLabel}>
        Garment {index + 1}
      </Text>
<View style={styles.garmentPriceInputWrapper}>
  <Text style={styles.currencySymbol}>₹</Text>
  <Text style={styles.currencyField}>
    {calculateGarmentTotal(garment).toFixed(2)}
  </Text>
</View>
    </View>
  ))}
</View>


<View style={styles.inputGroup}>
  <Text style={styles.label}>Payment Method</Text>

  <View style={styles.paymentMethodRow}>
    {["Cash", "UPI"].map((type) => (
      <TouchableOpacity
        key={type}
        style={[
          styles.paymentMethodChip,
          paymentData.method === type && styles.paymentMethodChipActive,
        ]}
        onPress={() =>
          setPaymentData((prev) => ({
            ...prev,
            method: prev.method === type ? "" : type,
          }))
        }
      >
        <Text
          style={[
            styles.paymentMethodText,
            paymentData.method === type && styles.paymentMethodTextActive,
          ]}
        >
          {type}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
</View>

{/* Discount */}
<View style={styles.inputGroup}>
  <Text style={styles.label}>Discount</Text>
  <View style={styles.currencyInput}>
    <Text style={styles.currencySymbol}>₹</Text>
    <TextInput
      style={styles.currencyField}
      value={paymentData.discount}
      onChangeText={(value) =>
        setPaymentData((prev) => ({
          ...prev,
          discount: value,
        }))
      }
      placeholder="0.00"
      keyboardType="decimal-pad"
    />
  </View>
</View>

              
                 <View style={styles.balanceCard}>
  <Text style={styles.balanceLabel}>Grand Total</Text>
  <Text style={styles.balanceAmount}>
    ₹ {calculateTotal().toFixed(2)}
  </Text>
</View>

{/* Advance Payment */}
<View style={styles.inputGroup}>
  <Text style={styles.label}>Advance Payment</Text>
  <View style={styles.currencyInput}>
    <Text style={styles.currencySymbol}>₹</Text>
    <TextInput
      style={styles.currencyField}
      value={paymentData.advance}
      onChangeText={(value) =>
        setPaymentData((prev) => ({
          ...prev,
          advance: value,
        }))
      }
      placeholder="0.00"
      keyboardType="decimal-pad"
    />
  </View>
</View>
<View style={styles.balanceCard}>
  <Text style={styles.balanceLabel}>Balance</Text>
  <Text style={styles.balanceAmount}>
    ₹ {calculateBalance().toFixed(2)}
  </Text>
</View>

                </>
              )}
            </View>

          {/* Submit Buttons Inside Scroll */}
<View style={styles.footerScroll}>
<TouchableOpacity
  style={styles.cancelButton}
  activeOpacity={0.8}
  onPress={() => confirmLeave(goToOrders)}
>
    <Text style={styles.cancelButtonText}>Cancel</Text>
  </TouchableOpacity>

<TouchableOpacity
  style={[
    styles.submitButton,
    (!isEssentialComplete() || creatingOrder) && styles.submitButtonDisabled
  ]}
  onPress={handleSubmit}
  activeOpacity={0.85}
disabled={!isEssentialComplete() || creatingOrder || submittingRef.current}
>
   <Text style={styles.submitButtonText}>
  {creatingOrder ? "Creating Order..." : "Create Order"}
</Text>
  </TouchableOpacity>
</View>

          
          </ScrollView>


{/* CUSTOMER LIST MODAL */}
<Modal
  visible={showCustomerModal}
  transparent={false}
  animationType="slide"
>
  <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>

    {/* ── Fixed Header ── */}
    <View style={styles.sheetFixedHeader}>
      <View style={styles.sheetHeaderRow}>
        <Text style={styles.sheetTitle}>Select Customer</Text>
        <TouchableOpacity
          style={styles.sheetCloseBtn}
          onPress={() => setShowCustomerModal(false)}
        >
          <Text style={styles.sheetCloseBtnText}>✕</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.sheetSearchInput}
        placeholder="Search by name or number..."
        placeholderTextColor="#94A3B8"
        value={customerSearch}
        onChangeText={handleCustomerSearch}
        autoCorrect={false}
        autoCapitalize="none"
      />
    </View>

    {/* ── Scrollable List ── */}
    <FlatList
      data={customers}
      keyExtractor={(item, index) => `${item._id}-${index}`}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      onEndReached={() => {
        if (customers.length >= 20 * page) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchCustomers(customerSearch, nextPage);
        }
      }}
      onEndReachedThreshold={0.5}
      contentContainerStyle={{ paddingBottom: 40 }}
      ListEmptyComponent={
        <View style={styles.sheetEmpty}>
          <Text style={styles.sheetEmptyText}>No customers found</Text>
        </View>
      }
      ItemSeparatorComponent={() => (
        <View style={{ height: 1, backgroundColor: "#F1F5F9" }} />
      )}
      renderItem={({ item: customer }) => (
        <TouchableOpacity
          style={styles.sheetCustomerRow}
          activeOpacity={0.7}
onPress={async () => {
  if (customerSelectMode === "main") {
    const fullName = `${customer.first_name} ${customer.last_name}`;

    setSelectedCustomer(customer);

    // ✅ FIX: pass customer directly, don't rely on state
if (!orderIdRef.current) {
  // First time → create order
  await createOrder(customer);
} else {
  // 🔥 Customer changed → UPDATE order
  try {
    await axios.put(
      `${BASE_URL}/api/orders/${orderIdRef.current}`,
      {
        customer_id: customer._id,
        customer_name: `${customer.first_name} ${customer.last_name}`,
      }
    );

    console.log("✅ Customer updated in order");
  } catch (err) {
    console.log("❌ Customer update failed", err);
  }
}
    setCustomerData({
      name: fullName,
      careOf: customer.care_of || "",
      mobileNo: customer.contact_no_1,
      contactNo: customer.contact_no_2 || "",
    });

    const m = customer.latest_measurements || {};

updateActiveGarment({
  measurements: {
    // 🔹 Upper Body
    shoulder: m.shoulder?.toString() || "",
    arm_length: m.arm_length?.toString() || "",
    sleeves_length: m.sleeves_length?.toString() || "",
    armhole: m.armhole?.toString() || "",
    biceps: m.biceps?.toString() || "",
    neck_size: m.neck_size?.toString() || "",
    back_neck: m.back_neck?.toString() || "",
    upper_chest: m.upper_chest?.toString() || "",
    chest: m.chest?.toString() || "",
    waist: m.waist?.toString() || "",
    waist_2: m.waist_2?.toString() || "",
    hip: m.hip?.toString() || "",
    top_length: m.top_length?.toString() || "",
    tucks: m.tucks?.toString() || "",

    // 🔹 Lower Body
    pant_length: m.pant_length?.toString() || "",
    plazo_length: m.plazo_length?.toString() || "",
    pyjama_length: m.pyjama_length?.toString() || "",
    salwar_length: m.salwar_length?.toString() || "",
    round_up_1: m.round_up_1?.toString() || "",
    round_up_2: m.round_up_2?.toString() || "",
    round_up_3: m.round_up_3?.toString() || "",
    main_round_up: m.main_round_up?.toString() || "",

    // 🔹 Other
    aster: m.aster?.toString() || "",
    dupatta: m.dupatta?.toString() || "",
  },
});
  

  } else if (customerSelectMode === "careOf") {
    setCustomerData(prev => ({
      ...prev,
      careOf: `${customer.first_name} ${customer.last_name}`,
    }));
  }

  setShowCustomerModal(false);
}}
        >
          <View style={styles.sheetCustomerAvatar}>
            <Text style={styles.sheetCustomerAvatarText}>
              {customer.first_name?.[0]?.toUpperCase() || "?"}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sheetCustomerName}>
              {customer.first_name} {customer.last_name}
            </Text>
            <Text style={styles.sheetCustomerPhone}>
              {customer.contact_no_1}
            </Text>
          </View>
          <Text style={{ fontSize: 20, color: "#CBD5E1" }}>›</Text>
        </TouchableOpacity>
      )}
    />

  </SafeAreaView>
</Modal>


{isAddingGarment && (
  <View style={styles.fullScreenLoader}>
    <ActivityIndicator size="large" color="#3B82F6" />
    <Text style={styles.loaderText}>Adding Garment...</Text>
  </View>
)}

          </View>
  </KeyboardAvoidingView>
</SafeAreaView>

    );
  }

  // ==================== MEASUREMENT INPUT COMPONENT ====================
  const MeasurementInput = ({ label, value, onChange }) => (
    <View style={styles.measurementInput}>
      <Text style={styles.measurementLabel}>{label}</Text>
      <View style={styles.measurementInputWrapper}>
     <TextInput
  style={styles.measurementField}
  value={value}
  onChangeText={onChange}
  
  placeholderTextColor="#CBD5E1"
  keyboardType="default"   
/>
      </View>
    </View>
  );

  // ==================== DRAWING CANVAS COMPONENT ====================
const DrawingCanvas = ({
  selectedColor,
  brushSize,
  selectedTool,
  paths,
  setPaths,
}) => {

    const currentPathRef = useRef("");
    const [currentPath, setCurrentPath] = useState("");
    const [redoStack, setRedoStack] = useState([]);

    const colorRef = useRef(selectedColor);
    const sizeRef = useRef(brushSize);
    const toolRef = useRef(selectedTool);

    useEffect(() => { colorRef.current = selectedColor; }, [selectedColor]);
    useEffect(() => { sizeRef.current = brushSize; }, [brushSize]);
    useEffect(() => { toolRef.current = selectedTool; }, [selectedTool]);

    const panResponder = useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,

        onPanResponderGrant: (evt) => {
          const { locationX, locationY } = evt.nativeEvent;
          const startPath = `M ${locationX} ${locationY}`;
          currentPathRef.current = startPath;
          setCurrentPath(startPath);
        },

        onPanResponderMove: (evt) => {
          const { locationX, locationY } = evt.nativeEvent;
          const prev = currentPathRef.current;

          const parts = prev.split(" ");
          const prevX = parseFloat(parts[parts.length - 2]);
          const prevY = parseFloat(parts[parts.length - 1]);

          const midX = (prevX + locationX) / 2;
          const midY = (prevY + locationY) / 2;

          const newPath = prev + ` Q ${prevX} ${prevY} ${midX} ${midY}`;
          currentPathRef.current = newPath;
          setCurrentPath(newPath);
        },

        onPanResponderRelease: () => {
          if (!currentPathRef.current) return;

          const newStroke = {
            d: currentPathRef.current,
            color: toolRef.current === "eraser" ? "#FFFFFF" : colorRef.current,
            strokeWidth: sizeRef.current,
          };

setPaths(prev => {
  const safePrev = Array.isArray(prev) ? prev : [];
  return [...safePrev, newStroke];
});

          setRedoStack([]);
          currentPathRef.current = "";
          setCurrentPath("");
        },
      })
    ).current;

    return (
      <View>
<View
  style={{
    height: 300,
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
  }}
  {...panResponder.panHandlers}
>
  <Svg height="100%" width="100%">
          
{Array.isArray(paths) &&
  paths.map((path, index) => (
              <Path
                key={index}
                d={path.d}
                stroke={path.color}
                strokeWidth={path.strokeWidth}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}

            {currentPath && (
              <Path
                d={currentPath}
                stroke={selectedTool === "eraser" ? "#FFFFFF" : selectedColor}
                strokeWidth={brushSize}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </Svg>
        </View>
      </View>
    );
  }

  // ==================== STYLES ====================
  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: "#F8FAFC",
    },
    container: {
      flex: 1,
      backgroundColor: "#F8FAFC",
    },

    header: {
    backgroundColor: "#FFFFFF",
      paddingHorizontal: 28,
      paddingVertical: 20,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderBottomWidth: 1,
      borderBottomColor: "#E9ECEF",
  },

    headerTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: "#0F172A",
      letterSpacing: -0.3,
    },
    headerSubtitle: {
      fontSize: 12,
      color: "#64748B",
      marginTop: 2,
      fontWeight: "500",
    },
    scrollView: {
      flex: 1,
    },
    section: {
      backgroundColor: "#FFFFFF",
      marginHorizontal: 16,
      marginTop: 16,
      borderRadius: 12,
      padding: 20,
      borderWidth: 1,
      borderColor: "#E2E8F0",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 1,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      flex: 1,
    },
    sectionHeaderCollapsible: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 0,
    },
    stepBadge: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: "#F1F5F9",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: "#E2E8F0",
    },
    stepBadgeActive: {
      backgroundColor: "#3B82F6",
      borderColor: "#3B82F6",
    },
    stepNumber: {
      fontSize: 14,
      fontWeight: "700",
      color: "#64748B",
    },
    stepNumberActive: {
      color: "#FFFFFF",
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: "#0F172A",
      flex: 1,
    },
    optionalBadge: {
      fontSize: 11,
      fontWeight: "600",
      color: "#94A3B8",
      backgroundColor: "#F1F5F9",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 4,
    },
    requiredBadge: {
      fontSize: 11,
      fontWeight: "600",
      color: "#EF4444",
      backgroundColor: "#FEF2F2",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 4,
    },
    countBadge: {
      backgroundColor: "#EFF6FF",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: "#BFDBFE",
    },
    countBadgeText: {
      fontSize: 11,
      fontWeight: "600",
      color: "#3B82F6",
    },
    expandIcon: {
      fontSize: 16,
      color: "#94A3B8",
      marginLeft: 12,
    },
    inputGroup: {
      marginBottom: 16,
      marginTop: 20,
    },
    rowInputs: {
      flexDirection: "row",
      gap: 12,
    },
    label: {
      fontSize: 12,
      fontWeight: "600",
      color: "#475569",
      marginBottom: 8,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    required: {
      color: "#EF4444",
    },
    input: {
      borderWidth: 1,
      borderColor: "#E2E8F0",
      backgroundColor: "#FFFFFF",
      paddingVertical: 14,
      paddingHorizontal: 16,
      fontSize: 14,
      color: "#0F172A",
      borderRadius: 10,
      fontWeight: "500",
    },
    textArea: {
      height: 100,
      textAlignVertical: "top",
      paddingTop: 12,
    },
    disabledInput: {
      borderWidth: 1,
      borderColor: "#E2E8F0",
      backgroundColor: "#F8FAFC",
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: 8,
    },
    disabledText: {
      fontSize: 14,
      color: "#94A3B8",
      fontWeight: "500",
    },
   currencyInput: {
  flexDirection: "row",
  alignItems: "center",
  borderWidth: 1,
  borderColor: "#E5E7EB",
  backgroundColor: "#F9FAFB",
  borderRadius: 8,
  paddingHorizontal: 14,
},
    currencySymbol: {
      fontSize: 15,
      fontWeight: "700",
      color: "#64748B",
      marginRight: 6,
    },
 currencyField: {
  flex: 1,
  paddingVertical: 12,
  fontSize: 14,
  color: "#111827",
},
    templateRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 20,
      marginTop: 20,
    },
    templateLabel: {
      fontSize: 12,
      fontWeight: "600",
      color: "#64748B",
    },
    templateButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: "#E2E8F0",
      backgroundColor: "#FFFFFF",
    },
    templateButtonActive: {
      borderColor: "#3B82F6",
      backgroundColor: "#EFF6FF",
    },
    templateButtonText: {
      fontSize: 12,
      fontWeight: "600",
      color: "#64748B",
    },
    templateButtonTextActive: {
      color: "#3B82F6",
    },
    measurementGroup: {
      marginBottom: 20,
        marginTop: 16,
    },
    measurementGroupTitle: {
      fontSize: 11,
      fontWeight: "700",
      color: "#64748B",
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 12,
      paddingBottom: 6,
      borderBottomWidth: 1,
      borderBottomColor: "#F1F5F9",
    },
 measurementRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  marginBottom: 12,
},
 measurementInput: {
  width: "30%",
},
    measurementLabel: {
      fontSize: 11,
      fontWeight: "600",
      color: "#64748B",
      marginBottom: 6,
    },
    measurementInputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: "#E2E8F0",
      backgroundColor: "#FFFFFF",
      borderRadius: 6,
      paddingHorizontal: 12,
    },
    measurementField: {
      flex: 1,
      paddingVertical: 10,
      fontSize: 13,
      color: "#0F172A",
      fontWeight: "600",
    },
    measurementUnit: {
      fontSize: 11,
      color: "#94A3B8",
      marginLeft: 4,
      fontWeight: "500",
    },
    
    designSubSection: {
      marginBottom: 24,
      marginTop: 20,
    },
    subSectionTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: "#475569",
      marginBottom: 12,
      letterSpacing: 0.3,
    },
    imageButtonRow: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 16,
    },
    imageButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: "#E2E8F0",
      backgroundColor: "#F8FAFC",
      alignItems: "center",
    },
    imageButtonText: {
      fontSize: 13,
      fontWeight: "600",
      color: "#475569",
    },
imagePreview: {
  alignSelf: "center",
  width: IG_SIZE,
  height: IG_SIZE,
  marginTop: 16,
  marginBottom: 20,
  borderRadius: 16,
  overflow: "hidden",
  backgroundColor: "#F1F5F9",
  borderWidth: 1,
  borderColor: "#E2E8F0",
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.08,
  shadowRadius: 10,
  elevation: 5,
},
previewImage: {
  width: "100%",
  height: "100%",
  resizeMode: "cover",
},
    removeImageButton: {
      position: "absolute",
      top: 8,
      right: 8,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: "rgba(0,0,0,0.6)",
      alignItems: "center",
      justifyContent: "center",
    },
    removeImageText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "700",
    },
    paintToolbar: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#FFFFFF",
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 10,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: "#E2E8F0",
      justifyContent: "space-between",
    },
    toolGroup: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    toolDivider: {
      width: 1,
      height: 24,
      backgroundColor: "#CBD5E1",
    },
    toolButton: {
      width: 36,
      height: 36,
      borderRadius: 8,
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: "#E2E8F0",
      alignItems: "center",
      justifyContent: "center",
    },
    toolButtonActive: {
      backgroundColor: "#3B82F6",
      borderColor: "#3B82F6",
    },
    toolIcon: {
      fontSize: 18,
    },
    colorButton: {
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 2,
      borderColor: "transparent",
    },
    colorButtonActive: {
      borderColor: "#0F172A",
      transform: [{ scale: 1.1 }],
    },
    colorButtonWhite: {
      borderWidth: 1,
      borderColor: "#CBD5E1",
    },
    brushButton: {
      width: 36,
      height: 36,
      borderRadius: 8,
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: "#E2E8F0",
      alignItems: "center",
      justifyContent: "center",
    },
    balanceCard: {
      backgroundColor: "#ECFDF5",
      padding: 16,
      borderRadius: 8,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
      borderWidth: 1,
      borderColor: "#A7F3D0",
    },
    balanceLabel: {
      fontSize: 12,
      fontWeight: "700",
      color: "#047857",
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    balanceAmount: {
      fontSize: 20,
      fontWeight: "800",
      color: "#065F46",
    },
    bottomSheetOverlay: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: "rgba(0,0,0,0.4)",
    },
    bottomSheetContainer: {
      backgroundColor: "#FFFFFF",
      padding: 20,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: "75%",
    },
    sheetHandle: {
      width: 40,
      height: 4,
      backgroundColor: "#CBD5E1",
      alignSelf: "center",
      borderRadius: 2,
      marginBottom: 15,
    },
    sheetTopRow: {
      flexDirection: "row",
      gap: 10,
      alignItems: "center",
    },
    sheetSearchInput: {
      flex: 1,
      backgroundColor: "#FFFFFF",
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderRadius: 12,
      fontSize: 14,
      fontWeight: "500",
      color: "#0F172A",
      borderWidth: 1.5,
      borderColor: "#E2E8F0",
    },
    sheetCustomerRow: {
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: "#F1F5F9",
    },
    sheetCustomerName: {
      fontSize: 15,
      fontWeight: "600",
      color: "#0F172A",
    },
    sheetCustomerPhone: {
      fontSize: 13,
      color: "#64748B",
      marginTop: 2,
    },
    addGarmentWrapper: {
      marginHorizontal: 16,
      marginTop: 20,
      alignItems: "flex-end",
    },
    addGarmentBtn: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: "#F8FAFF",
      borderWidth: 1,
      borderColor: "#DCE7FF",
      shadowColor: "#3B82F6",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 2,
    },
    addGarmentIcon: {
      fontSize: 16,
      fontWeight: "700",
      color: "#3B82F6",
      marginRight: 6,
    },
    addGarmentText: {
      fontSize: 13,
      fontWeight: "600",
      color: "#3B82F6",
    },
    garmentTabs: {
      flexDirection: "row",
      marginHorizontal: 16,
      marginTop: 10,
      gap: 8,
    },
    garmentTab: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: "#F1F5F9",
    },
    garmentTabActive: {
      backgroundColor: "#3B82F6",
    },
    garmentTabText: {
      fontSize: 13,
      fontWeight: "600",
      color: "#475569",
    },
    garmentTabTextActive: {
      color: "#FFFFFF",
    },
    garmentPriceRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 12,
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: "#E2E8F0",
      marginBottom: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 4,
      elevation: 2,
    },
    garmentPriceLabel: {
      fontSize: 14,
      fontWeight: "700",
      color: "#1E293B",
      letterSpacing: 0.3,
    },
    garmentPriceInputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#F8FAFC",
      borderRadius: 10,
      borderWidth: 1,
      borderColor: "#E2E8F0",
      paddingHorizontal: 12,
      minWidth: 110,
    },
    paymentMethodRow: {
      flexDirection: "row",
      gap: 12,
    },
    paymentMethodChip: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: "#E2E8F0",
      backgroundColor: "#FFFFFF",
      alignItems: "center",
    },
    paymentMethodChipActive: {
      backgroundColor: "#EFF6FF",
      borderColor: "#3B82F6",
    },
    paymentMethodText: {
      fontSize: 14,
      fontWeight: "600",
      color: "#64748B",
    },
    paymentMethodTextActive: {
      color: "#3B82F6",
    },
    footerScroll: {
      flexDirection: "row",
      gap: 12,
      marginTop: 30,
      paddingHorizontal: 16,
    },
    cancelButton: {
      flex: 1,
      paddingVertical: 16,
      borderRadius: 14,
      backgroundColor: "#FFFFFF",
      borderWidth: 1.5,
      borderColor: "#E2E8F0",
      alignItems: "center",
    },
    cancelButtonText: {
      fontSize: 15,
      fontWeight: "600",
      color: "#64748B",
    },
    submitButton: {
      flex: 2,
      paddingVertical: 16,
      borderRadius: 14,
      backgroundColor: "#3B82F6",
      alignItems: "center",
      shadowColor: "#3B82F6",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.25,
      shadowRadius: 10,
      elevation: 6,
    },
    submitButtonDisabled: {
      backgroundColor: "#CBD5E1",
      shadowOpacity: 0,
      elevation: 0,
    },
    submitButtonText: {
      fontSize: 15,
      fontWeight: "700",
      color: "#FFFFFF",
      letterSpacing: 0.5,
    },

    // ── Inline Extra Work Grid ──
    inlineExtraWorkGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      marginTop: 16,
    },
    inlineCardWrapper: {
      width: "23%",
    },
inlineCard: {
  backgroundColor: "#F8FAFC",
  borderRadius: 10,
  paddingVertical: 10,
  paddingHorizontal: 8,
  alignItems: "center",
  flexDirection: "column",    
  justifyContent: "center",
  borderWidth: 1.5,
  borderColor: "#E8EDF5",
  minHeight: 44,
  position: "relative",
},
inlineCardSelected: {
  backgroundColor: "#EFF6FF",
  borderColor: "#3B82F6",
  flexDirection: "column",     
  alignItems: "center",
  justifyContent: "center",
  minHeight: 80,
},
    tick: {
      position: "absolute",
      top: 6,
      right: 6,
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: "#3B82F6",
      alignItems: "center",
      justifyContent: "center",
    },
    tickText: {
      color: "#FFF",
      fontSize: 10,
      fontWeight: "800",
    },
    cardIcon: {
      fontSize: 16,
      marginBottom: 4,
    },
 cardLabel: {
  fontSize: 10,
  fontWeight: "600",
  color: "#64748B",
  textAlign: "center",
  flexShrink: 1,

},
    cardLabelSelected: {
      color: "#1D4ED8",
    },
    amountRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 8,
      backgroundColor: "#FFFFFF",
      borderRadius: 6,
      borderWidth: 1.5,
      borderColor: "#BFDBFE",
      paddingHorizontal: 6,
      paddingVertical: 3,
      width: "100%",
    },
    rupee: {
      fontSize: 12,
      fontWeight: "700",
      color: "#3B82F6",
      marginRight: 2,
    },
    amountInput: {
      flex: 1,
      fontSize: 13,
      fontWeight: "700",
      color: "#0F172A",
      paddingVertical: 2,
    },
    cardInnerRow: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: 4,
},
inputDisabled: {
  backgroundColor: "#F1F5F9",
  opacity: 0.7,
},

sheetFixedHeader: {
  backgroundColor: "#FFFFFF",
  paddingHorizontal: 20,
  paddingTop: 16,
  paddingBottom: 12,
  borderBottomWidth: 1,
  borderBottomColor: "#E2E8F0",
},
sheetHeaderRow: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 14,
},
sheetTitle: {
  fontSize: 18,
  fontWeight: "700",
  color: "#0F172A",
},
sheetCloseBtn: {
  width: 34,
  height: 34,
  borderRadius: 17,
  backgroundColor: "#F1F5F9",
  alignItems: "center",
  justifyContent: "center",
},
sheetCloseBtnText: {
  fontSize: 13,
  fontWeight: "700",
  color: "#64748B",
},
sheetSearchInput: {
  backgroundColor: "#F1F5F9",
  paddingHorizontal: 16,
  paddingVertical: 13,
  borderRadius: 12,
  fontSize: 14,
  fontWeight: "500",
  color: "#0F172A",
},
sheetCustomerRow: {
  flexDirection: "row",
  alignItems: "center",
  paddingVertical: 14,
  paddingHorizontal: 20,
  gap: 14,
  backgroundColor: "#FFFFFF",
},
sheetCustomerAvatar: {
  width: 42,
  height: 42,
  borderRadius: 21,
  backgroundColor: "#EFF6FF",
  alignItems: "center",
  justifyContent: "center",
  borderWidth: 1,
  borderColor: "#BFDBFE",
},
sheetCustomerAvatarText: {
  fontSize: 17,
  fontWeight: "700",
  color: "#3B82F6",
},
sheetCustomerName: {
  fontSize: 15,
  fontWeight: "600",
  color: "#0F172A",
},
sheetCustomerPhone: {
  fontSize: 13,
  color: "#64748B",
  marginTop: 2,
},
sheetEmpty: {
  alignItems: "center",
  paddingVertical: 60,
},
sheetEmptyText: {
  fontSize: 14,
  color: "#94A3B8",
  fontWeight: "500",
},

fullScreenLoader: {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  justifyContent: "center",
  alignItems: "center",
  zIndex: 999,
},

loaderText: {
  marginTop: 12,
  fontSize: 14,
  color: "#FFFFFF",
  fontWeight: "600",
},
  });