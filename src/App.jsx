import { useState, useEffect } from "react";
import { Search, Package, MapPin, Plus, Edit2, Trash2, Archive, Grid } from "lucide-react";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "./firebase";

const normalizarTexto = (texto) =>
  texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const similitud = (a, b) => {
  const len = Math.max(a.length, b.length);
  let same = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] === b[i]) same++;
  }
  return same / len;
};

function App() {
  const [busqueda, setBusqueda] = useState("");
  const [resultado, setResultado] = useState([]);
  const [inventario, setInventario] = useState([]);
  const [vistaActual, setVistaActual] = useState("buscar");
  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: "",
    cantidad: "",
    ubicacion: "",
    tipoCanastilla: "A",
    marca: "",
  });

  const cargarInventario = async () => {
    try {
      const snapshot = await getDocs(collection(db, "inventario"));
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setInventario(data);
    } catch (error) {
      console.error("Error al cargar inventario:", error);
    }
  };

  useEffect(() => {
    cargarInventario();
  }, []);

  useEffect(() => {
    if (busqueda.trim() === "") {
      setResultado([]);
      return;
    }

    const termino = normalizarTexto(busqueda.trim());
    const resultados = inventario
      .map((item) => {
        const nombre = normalizarTexto(item.nombre);
        const marca = normalizarTexto(item.marca || "");
        const similitudNombre = similitud(nombre, termino);
        const similitudMarca = similitud(marca, termino);
        const incluye = nombre.includes(termino) || marca.includes(termino);
        
        return { 
          ...item, 
          similitud: Math.max(similitudNombre, similitudMarca) + (incluye ? 0.3 : 0)
        };
      })
      .filter((item) => item.similitud >= 0.4)
      .sort((a, b) => b.similitud - a.similitud);

    setResultado(resultados);
  }, [busqueda, inventario]);

  const agregarProducto = async () => {
    if (!nuevoProducto.nombre || !nuevoProducto.cantidad || !nuevoProducto.ubicacion) {
      alert("Por favor completa todos los campos obligatorios.");
      return;
    }

    try {
      await addDoc(collection(db, "inventario"), {
        nombre: nuevoProducto.nombre,
        cantidad: parseInt(nuevoProducto.cantidad),
        ubicacion: nuevoProducto.ubicacion,
        tipoCanastilla: nuevoProducto.tipoCanastilla,
        marca: nuevoProducto.marca,
        fechaRegistro: new Date().toISOString(),
      });
      alert("✅ Producto agregado correctamente");
      setNuevoProducto({ nombre: "", cantidad: "", ubicacion: "", tipoCanastilla: "A", marca: "" });
      cargarInventario();
    } catch (error) {
      console.error("Error al agregar producto:", error);
      alert("❌ Error al guardar el producto.");
    }
  };

  const actualizarProducto = async (id) => {
    const item = inventario.find(i => i.id === id);
    if (!item) return;

    const nuevaCantidad = prompt("Nueva cantidad:", item.cantidad);
    if (nuevaCantidad === null) return;

    try {
      const docRef = doc(db, "inventario", id);
      await updateDoc(docRef, { cantidad: parseInt(nuevaCantidad) });
      alert("✅ Producto actualizado");
      cargarInventario();
    } catch (error) {
      console.error("Error al actualizar producto:", error);
    }
  };

  const eliminarProducto = async (id) => {
    if (!confirm("¿Seguro que quieres eliminar este producto?")) return;
    try {
      const docRef = doc(db, "inventario", id);
      await deleteDoc(docRef);
      alert("🗑️ Producto eliminado");
      cargarInventario();
    } catch (error) {
      console.error("Error al eliminar producto:", error);
    }
  };

  const getColorCantidad = (cantidad) => {
    if (cantidad >= 15) return "bg-green-500";
    if (cantidad >= 8) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-lg">
                <Package className="text-white" size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Sistema de Inventario</h1>
                <p className="text-sm text-gray-500">Gestión de Repuestos y Ubicaciones</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setVistaActual("buscar")}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                  vistaActual === "buscar"
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <Search size={18} />
                Buscar
              </button>
              <button
                onClick={() => setVistaActual("gestionar")}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                  vistaActual === "gestionar"
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <Grid size={18} />
                Gestionar
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {vistaActual === "buscar" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={24} />
                <input
                  type="text"
                  placeholder="Buscar repuesto por nombre o marca..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full pl-14 pr-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-all"
                />
              </div>
              {busqueda && (
                <p className="mt-3 text-sm text-gray-500 flex items-center gap-2">
                  <Archive size={16} />
                  {resultado.length} resultado(s) encontrado(s)
                </p>
              )}
            </div>

            {busqueda === "" ? (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100">
                <div className="bg-gradient-to-br from-blue-100 to-indigo-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="text-blue-600" size={32} />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  Comienza a buscar
                </h3>
                <p className="text-gray-500">
                  Escribe el nombre o marca del repuesto en el buscador
                </p>
              </div>
            ) : resultado.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100">
                <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="text-red-600" size={32} />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  No se encontraron resultados
                </h3>
                <p className="text-gray-500">
                  Intenta con otro término de búsqueda
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {resultado.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all p-6 border border-gray-100 hover:border-blue-200"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-800 mb-1">
                          {item.nombre}
                        </h3>
                        {item.marca && (
                          <span className="inline-block bg-purple-100 text-purple-700 text-xs px-3 py-1 rounded-full font-medium">
                            {item.marca}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`${getColorCantidad(item.cantidad)} text-white text-sm font-bold px-3 py-1 rounded-full`}>
                          {item.cantidad}
                        </span>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="text-blue-600" size={18} />
                        <span className="text-sm font-medium text-gray-600">Ubicación</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-blue-600">
                          {item.ubicacion}
                        </span>
                        <span className="bg-white px-3 py-1 rounded-full text-xs font-medium text-gray-600">
                          Estante {item.tipoCanastilla}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        Coincidencia: {(item.similitud * 100).toFixed(0)}%
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => actualizarProducto(item.id)}
                          className="bg-yellow-100 text-yellow-700 p-2 rounded-lg hover:bg-yellow-200 transition-all"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => eliminarProducto(item.id)}
                          className="bg-red-100 text-red-700 p-2 rounded-lg hover:bg-red-200 transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {vistaActual === "gestionar" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-gradient-to-br from-green-500 to-emerald-500 p-2 rounded-lg">
                  <Plus className="text-white" size={20} />
                </div>
                <h2 className="text-xl font-bold text-gray-800">Agregar Nuevo Producto</h2>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Nombre del producto *"
                  value={nuevoProducto.nombre}
                  onChange={(e) => setNuevoProducto({ ...nuevoProducto, nombre: e.target.value })}
                  className="border-2 border-gray-200 p-3 rounded-lg focus:border-blue-500 focus:outline-none transition-all"
                />
                <input
                  type="text"
                  placeholder="Marca"
                  value={nuevoProducto.marca}
                  onChange={(e) => setNuevoProducto({ ...nuevoProducto, marca: e.target.value })}
                  className="border-2 border-gray-200 p-3 rounded-lg focus:border-blue-500 focus:outline-none transition-all"
                />
                <input
                  type="number"
                  placeholder="Cantidad *"
                  value={nuevoProducto.cantidad}
                  onChange={(e) => setNuevoProducto({ ...nuevoProducto, cantidad: e.target.value })}
                  className="border-2 border-gray-200 p-3 rounded-lg focus:border-blue-500 focus:outline-none transition-all"
                />
                <input
                  type="text"
                  placeholder="Ubicación (Ej: A-3-B) *"
                  value={nuevoProducto.ubicacion}
                  onChange={(e) => setNuevoProducto({ ...nuevoProducto, ubicacion: e.target.value })}
                  className="border-2 border-gray-200 p-3 rounded-lg focus:border-blue-500 focus:outline-none transition-all"
                />
                <select
                  value={nuevoProducto.tipoCanastilla}
                  onChange={(e) => setNuevoProducto({ ...nuevoProducto, tipoCanastilla: e.target.value })}
                  className="border-2 border-gray-200 p-3 rounded-lg focus:border-blue-500 focus:outline-none transition-all"
                >
                  <option value="A">Estante A (22 canastillas)</option>
                  <option value="B">Estante B (14 canastillas)</option>
                </select>
                <button
                  onClick={agregarProducto}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-3 rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all font-semibold flex items-center justify-center gap-2"
                >
                  <Plus size={20} />
                  Guardar Producto
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Archive className="text-blue-600" size={24} />
                Inventario Completo ({inventario.length} productos)
              </h2>
              <div className="space-y-3">
                {inventario.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No hay productos en el inventario</p>
                ) : (
                  inventario.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800">{item.nombre}</h4>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className="text-xs text-gray-500">{item.ubicacion}</span>
                          {item.marca && (
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                              {item.marca}
                            </span>
                          )}
                          <span className={`${getColorCantidad(item.cantidad)} text-white text-xs px-2 py-0.5 rounded-full font-medium`}>
                            {item.cantidad} unid.
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => actualizarProducto(item.id)}
                          className="bg-yellow-100 text-yellow-700 p-2 rounded-lg hover:bg-yellow-200 transition-all"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => eliminarProducto(item.id)}
                          className="bg-red-100 text-red-700 p-2 rounded-lg hover:bg-red-200 transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;