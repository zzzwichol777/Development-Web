<?php
// =====================================================
// FUTLOCK - API DE PRODUCTOS/INVENTARIO (CRUD)
// =====================================================

require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$conn = getConnection();

// Mapeo de categorías a tablas
$categorias = [
    'guantes' => ['tabla' => 'Guantes_Portero', 'id' => 'ID_Guantes'],
    'casacas' => ['tabla' => 'Casacas', 'id' => 'ID_Casacas'],
    'balones' => ['tabla' => 'Balon', 'id' => 'ID_Balon'],
    'tacos' => ['tabla' => 'Tacos_Tenis', 'id' => 'ID_Tacos'],
    'espinilleras' => ['tabla' => 'Espinilleras', 'id' => 'ID_Espinilleras'],
    'pizarras' => ['tabla' => 'Pizarras_Magneticas', 'id' => 'ID_Pizarra'],
    'carpetas' => ['tabla' => 'Carpetas_Tacticas', 'id' => 'ID_Carpetas']
];

switch ($method) {
    case 'GET':
        $categoria = $_GET['categoria'] ?? null;
        $id = $_GET['id'] ?? null;
        $search = $_GET['search'] ?? null;
        
        if ($categoria && isset($categorias[$categoria])) {
            // Obtener productos de una categoría específica
            $tabla = $categorias[$categoria]['tabla'];
            $idCol = $categorias[$categoria]['id'];
            
            // Preparar consulta según la categoría para obtener campos estandarizados
            $sqlSelect = "";
            switch ($categoria) {
                case 'guantes':
                    $sqlSelect = "SELECT ID_Guantes as ID, CONCAT(Marca, ' ', Color, ' - Talla ', No_Talla) as Nombre, 'Guantes' as Categoria, Precio, Stock FROM Guantes_Portero";
                    break;
                case 'casacas':
                    $sqlSelect = "SELECT ID_Casacas as ID, CONCAT('Casaca ', Color, ' - Talla ', Talla) as Nombre, 'Casacas' as Categoria, Precio, Stock FROM Casacas";
                    break;
                case 'balones':
                    $sqlSelect = "SELECT ID_Balon as ID, CONCAT(Marca, ' ', Color) as Nombre, 'Balones' as Categoria, Precio, Stock FROM Balon";
                    break;
                case 'tacos':
                    $sqlSelect = "SELECT ID_Tacos as ID, CONCAT(Marca, ' ', Color, ' - Talla ', No_Talla) as Nombre, 'Tacos' as Categoria, Precio, Stock FROM Tacos_Tenis";
                    break;
                case 'espinilleras':
                    $sqlSelect = "SELECT ID_Espinilleras as ID, CONCAT('Espinilleras ', Color, ' - Talla ', No_Talla) as Nombre, 'Espinilleras' as Categoria, Precio, Stock FROM Espinilleras";
                    break;
                case 'pizarras':
                    $sqlSelect = "SELECT ID_Pizarra as ID, CONCAT('Pizarra ', Tamano) as Nombre, 'Pizarras' as Categoria, Precio, Stock FROM Pizarras_Magneticas";
                    break;
                case 'carpetas':
                    $sqlSelect = "SELECT ID_Carpetas as ID, CONCAT('Carpeta Táctica ', Tamano) as Nombre, 'Carpetas' as Categoria, Precio, Stock FROM Carpetas_Tacticas";
                    break;
            }
            
            if ($id) {
                $sqlSelect .= " WHERE $idCol = " . intval($id);
            }
            
            $sqlSelect .= " ORDER BY ID DESC";
            
            $result = $conn->query($sqlSelect);
            $productos = [];
            while ($row = $result->fetch_assoc()) {
                $productos[] = $row;
            }
            jsonResponse(['success' => true, 'data' => $productos]);
            
        } else {
            // Obtener TODOS los productos de todas las categorías
            $todosProductos = [];
            
            // Guantes
            $sql = "SELECT ID_Guantes as ID, CONCAT(Marca, ' ', Color, ' - Talla ', No_Talla) as Nombre, 'Guantes' as Categoria, Precio, Stock FROM Guantes_Portero";
            if ($categoria === 'guantes' || (!$categoria && !$search)) {
                $result = $conn->query($sql);
                while ($row = $result->fetch_assoc()) $todosProductos[] = $row;
            }
            
            // Casacas
            $sql = "SELECT ID_Casacas as ID, CONCAT('Casaca ', Color, ' - Talla ', Talla) as Nombre, 'Casacas' as Categoria, Precio, Stock FROM Casacas";
            if ($categoria === 'casacas' || (!$categoria && !$search)) {
                $result = $conn->query($sql);
                while ($row = $result->fetch_assoc()) $todosProductos[] = $row;
            }
            
            // Balones
            $sql = "SELECT ID_Balon as ID, CONCAT(Marca, ' ', Color) as Nombre, 'Balones' as Categoria, Precio, Stock FROM Balon";
            if ($categoria === 'balones' || (!$categoria && !$search)) {
                $result = $conn->query($sql);
                while ($row = $result->fetch_assoc()) $todosProductos[] = $row;
            }
            
            // Tacos
            $sql = "SELECT ID_Tacos as ID, CONCAT(Marca, ' ', Color, ' - Talla ', No_Talla) as Nombre, 'Tacos' as Categoria, Precio, Stock FROM Tacos_Tenis";
            if ($categoria === 'tacos' || (!$categoria && !$search)) {
                $result = $conn->query($sql);
                while ($row = $result->fetch_assoc()) $todosProductos[] = $row;
            }
            
            // Espinilleras
            $sql = "SELECT ID_Espinilleras as ID, CONCAT('Espinilleras ', Color, ' - Talla ', No_Talla) as Nombre, 'Espinilleras' as Categoria, Precio, Stock FROM Espinilleras";
            if ($categoria === 'espinilleras' || (!$categoria && !$search)) {
                $result = $conn->query($sql);
                while ($row = $result->fetch_assoc()) $todosProductos[] = $row;
            }
            
            // Pizarras
            $sql = "SELECT ID_Pizarra as ID, CONCAT('Pizarra ', Tamano) as Nombre, 'Pizarras' as Categoria, Precio, Stock FROM Pizarras_Magneticas";
            if ($categoria === 'pizarras' || (!$categoria && !$search)) {
                $result = $conn->query($sql);
                while ($row = $result->fetch_assoc()) $todosProductos[] = $row;
            }
            
            // Carpetas
            $sql = "SELECT ID_Carpetas as ID, CONCAT('Carpeta Táctica ', Tamano) as Nombre, 'Carpetas' as Categoria, Precio, Stock FROM Carpetas_Tacticas";
            if ($categoria === 'carpetas' || (!$categoria && !$search)) {
                $result = $conn->query($sql);
                while ($row = $result->fetch_assoc()) $todosProductos[] = $row;
            }
            
            // Aplicar filtro de búsqueda si existe
            if ($search) {
                $searchTerm = strtolower($search);
                $todosProductos = array_filter($todosProductos, function($producto) use ($searchTerm) {
                    return stripos($producto['Nombre'], $searchTerm) !== false ||
                           stripos($producto['Categoria'], $searchTerm) !== false;
                });
                $todosProductos = array_values($todosProductos); // Re-index array
            }
            
            jsonResponse(['success' => true, 'data' => $todosProductos]);
        }
        break;
        
    case 'POST':
        $data = getRequestData();
        $categoria = $data['categoria'] ?? null;
        
        if (!$categoria || !isset($categorias[$categoria])) {
            jsonResponse(['success' => false, 'message' => 'Categoría no válida'], 400);
        }
        
        // Insertar según la categoría
        switch ($categoria) {
            case 'guantes':
                $stmt = $conn->prepare("INSERT INTO Guantes_Portero (No_Talla, Color, Material, Marca, Precio, Stock) VALUES (?, ?, ?, ?, ?, ?)");
                $stmt->bind_param("ssssdi", $data['talla'], $data['color'], $data['material'], $data['marca'], $data['precio'], $data['stock']);
                break;
            case 'casacas':
                $stmt = $conn->prepare("INSERT INTO Casacas (Talla, Color, Precio, Stock) VALUES (?, ?, ?, ?)");
                $stmt->bind_param("ssdi", $data['talla'], $data['color'], $data['precio'], $data['stock']);
                break;
            case 'balones':
                $stmt = $conn->prepare("INSERT INTO Balon (Marca, Color, Tipo_Superficie, Precio, Stock) VALUES (?, ?, ?, ?, ?)");
                $stmt->bind_param("sssdi", $data['marca'], $data['color'], $data['tipo_superficie'], $data['precio'], $data['stock']);
                break;
            case 'tacos':
                $stmt = $conn->prepare("INSERT INTO Tacos_Tenis (No_Talla, Color, Tipo_Superficie, Marca, Precio, Stock) VALUES (?, ?, ?, ?, ?, ?)");
                $stmt->bind_param("ssssdi", $data['talla'], $data['color'], $data['tipo_superficie'], $data['marca'], $data['precio'], $data['stock']);
                break;
            case 'espinilleras':
                $stmt = $conn->prepare("INSERT INTO Espinilleras (No_Talla, Color, Material, Precio, Stock) VALUES (?, ?, ?, ?, ?)");
                $stmt->bind_param("sssdi", $data['talla'], $data['color'], $data['material'], $data['precio'], $data['stock']);
                break;
            case 'pizarras':
                $stmt = $conn->prepare("INSERT INTO Pizarras_Magneticas (Tamano, Material, Color, Descripcion, Precio, Stock) VALUES (?, ?, ?, ?, ?, ?)");
                $stmt->bind_param("ssssdi", $data['tamano'], $data['material'], $data['color'], $data['descripcion'], $data['precio'], $data['stock']);
                break;
            case 'carpetas':
                $stmt = $conn->prepare("INSERT INTO Carpetas_Tacticas (Tamano, Material, Color, Descripcion, Precio, Stock) VALUES (?, ?, ?, ?, ?, ?)");
                $stmt->bind_param("ssssdi", $data['tamano'], $data['material'], $data['color'], $data['descripcion'], $data['precio'], $data['stock']);
                break;
        }
        
        if ($stmt->execute()) {
            jsonResponse([
                'success' => true, 
                'message' => 'Producto creado exitosamente',
                'id' => $conn->insert_id
            ], 201);
        } else {
            jsonResponse(['success' => false, 'message' => 'Error al crear producto: ' . $conn->error], 500);
        }
        break;
        
    case 'PUT':
        $data = getRequestData();
        $categoria = $data['categoria'] ?? $_GET['categoria'] ?? null;
        $id = $data['id'] ?? $_GET['id'] ?? null;
        
        if (!$categoria || !$id) {
            jsonResponse(['success' => false, 'message' => 'Categoría e ID requeridos'], 400);
        }
        
        $tabla = $categorias[$categoria]['tabla'];
        $idCol = $categorias[$categoria]['id'];
        
        // Actualizar precio y stock (campos comunes)
        $stmt = $conn->prepare("UPDATE $tabla SET Precio = ?, Stock = ? WHERE $idCol = ?");
        $stmt->bind_param("dii", $data['precio'], $data['stock'], $id);
        
        if ($stmt->execute()) {
            jsonResponse(['success' => true, 'message' => 'Producto actualizado exitosamente']);
        } else {
            jsonResponse(['success' => false, 'message' => 'Error al actualizar producto'], 500);
        }
        break;
        
    case 'DELETE':
        $categoria = $_GET['categoria'] ?? null;
        $id = $_GET['id'] ?? null;
        
        if (!$categoria || !$id) {
            jsonResponse(['success' => false, 'message' => 'Categoría e ID requeridos'], 400);
        }
        
        $tabla = $categorias[$categoria]['tabla'];
        $idCol = $categorias[$categoria]['id'];
        
        $stmt = $conn->prepare("DELETE FROM $tabla WHERE $idCol = ?");
        $stmt->bind_param("i", $id);
        
        if ($stmt->execute()) {
            jsonResponse(['success' => true, 'message' => 'Producto eliminado exitosamente']);
        } else {
            jsonResponse(['success' => false, 'message' => 'Error al eliminar producto'], 500);
        }
        break;
        
    default:
        jsonResponse(['success' => false, 'message' => 'Método no permitido'], 405);
}

$conn->close();
?>
