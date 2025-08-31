"use client"

import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import type { PriceNode } from "@/lib/types"
import { Label } from "@/components/ui/label";

interface PriceListTreeProps {
  priceList: Record<string, PriceNode>
  onUpdate: (newPriceList: Record<string, PriceNode>) => void
  currency: string
}


// 🔥 Утилиты для сериализации/десериализации пути
const serializePath = (path: string[]) => path.join("||")
const deserializePath = (pathStr: string) => pathStr.split("||")

export default function PriceListTree({ priceList, onUpdate, currency }: PriceListTreeProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")
  const [editType, setEditType] = useState<"name" | "price">("name")
  const [showAddCategory, setShowAddCategory] = useState(false)

  const [newCategoryName, setNewCategoryName] = useState("")
  const [newSubcategoryName, setNewSubcategoryName] = useState("")
  const [showAddSubcategory, setShowAddSubcategory] = useState<null | string>(null)

  const [newServiceName, setNewServiceName] = useState<string>("")
  const [newServicePrice, setNewServicePrice] = useState<number>(0)
  const [showAddService, setShowAddService] = useState<null | string>(null)
  const [deleteModal, setDeleteModal] = useState<string | null>(null)


  /** ---------------- HELPERS ---------------- */


  const toggleNode = (path: string[]) => {
    const id = serializePath(path) // 🔥 вместо строки с точками
    setExpandedNodes((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const deepClone = <T,>(obj: T): T => JSON.parse(JSON.stringify(obj))


  /** ---------------- EDITING ---------------- */

// Начало редактирования
  const startEdit = (path: string[], type: "name" | "price", currentValue: string | number) => {
    setEditingItem(serializePath(path)) // 🔥 сериализация пути
    setEditType(type)
    setEditValue(currentValue.toString())
  }

// Сохранение изменений
  const saveEdit = () => {
    if (!editingItem) return

    // Клонируем прайс-лист, чтобы не мутировать напрямую
    const newPriceList = deepClone(priceList)


    const pathParts = deserializePath(editingItem) // 🔥 вместо split(".")
    const keyToEdit = pathParts[pathParts.length - 1]
    const parentPath = pathParts.slice(0, -1)

    // Получаем родителя узла
    let parentNode: any = newPriceList
    // eslint-disable-next-line no-restricted-syntax
    for (const part of parentPath) {
      if (!parentNode[part]) return
      parentNode = parentNode[part].children
    }

    if (editType === "price") {
      const price = parseFloat(editValue)

      if (Number.isNaN(price)) return

      parentNode[keyToEdit].price = price
    } else {
      // Переименование ключа
      const nodeData = parentNode[keyToEdit]
      delete parentNode[keyToEdit]
      parentNode[editValue] = { ...nodeData, name: editValue }
    }

    onUpdate(newPriceList)
    setEditingItem(null)
    setEditValue("")
  }

// Отмена редактирования
  const cancelEdit = () => {
    setEditingItem(null)
    setEditValue("")
  }


  /** ---------------- CRUD ---------------- */

  const confirmDeleteItem = () => {
    if (!deleteModal) return
    const pathParts = deserializePath(deleteModal) // 🔥
    const newPriceList = deepClone(priceList)

    let current: any = newPriceList
    for (let i = 0; i < pathParts.length - 1; i += 1) {
      const key = pathParts[i]
      if (!current[key]) return
      current = current[key].children // переходим в children
    }

    delete current[pathParts[pathParts.length - 1]] // удаляем узел
    onUpdate(newPriceList)
    setDeleteModal(null)
  }

  const addCategory = () => {
    if (!newCategoryName.trim()) return
    const newPriceList = {
      ...priceList,
      [newCategoryName]: { name: newCategoryName, children: {} },
    }
    onUpdate(newPriceList)
    setNewCategoryName("")
    setShowAddCategory(false)
  }

  const addSubcategory = () => {
    if (!newSubcategoryName.trim()) {
      setShowAddSubcategory(null)
      setNewSubcategoryName("")
      return
    }
    const subcategory = { name: newSubcategoryName, children: {} }

    const pathParts = deserializePath(showAddSubcategory!)

    const updatedPriceList = deepClone(priceList)

    let current = updatedPriceList

    // Проходим по пути
    for (let i = 0; i < pathParts.length; i += 1) {
      const key = pathParts[i]

      if (!current[key]) return
      if (!current[key].children) current[key].children = {}

      current = current[key].children
    }

    // Добавляем новую сабкатегорию
    current[newSubcategoryName] = subcategory

    // Отдаём весь новый прайс-лист, а не children
    onUpdate(updatedPriceList)
    setShowAddSubcategory(null)
    setNewSubcategoryName("")
  }

  const addService = () => {
    if (Number.isNaN(newServicePrice) || newServiceName === "") {
      setShowAddService(null)
      setNewServicePrice(0)
      setNewServiceName("")
      // alert("Invalid price or name")
      return
    }
    const service = { name: newServiceName, price: newServicePrice }
    console.log(`Service: ${service}`)
    const pathParts = deserializePath(showAddService!)
    const updatedPriceList = deepClone(priceList)

    let current = updatedPriceList

    // Проходим по пути
    for (let i = 0; i < pathParts.length; i += 1) {
      const key = pathParts[i]

      if (!current[key]) return
      if (!current[key].children) current[key].children = {}

      current = current[key].children
    }

    // Добавляем новую сабкатегорию
    current[newServiceName] = service

    // Отдаём весь новый прайс-лист, а не children
    onUpdate(updatedPriceList)
    setShowAddService(null)
    setNewServicePrice(0)
    setNewServiceName("")
  }

  /** ---------------- RENDER ---------------- */

  const renderTreeItem = (key: string, node: PriceNode, path: string[], level = 0) => {

    const pathId = serializePath(path)
    const isExpanded = expandedNodes.has(pathId)

    const hasChildren = node.children && Object.keys(node.children).length > 0
    const isLeaf = node.price !== undefined
    const isEditingName = editingItem === pathId && editType === "name"
    const isEditingPrice = editingItem === pathId && editType === "price"

    return (
      <div key={pathId} className={level > 0 ? "ml-6" : ""}>
        <div className="flex items-center gap-2 py-2 px-3 hover:bg-gray-50 rounded-md group">
          {hasChildren && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleNode(path)}
              className="w-6 h-6 p-0 text-gray-400"
            >
              {isExpanded ? "−" : "+"}
            </Button>
          )}

          {/* Name & Price */}
          <div className="flex-1 flex items-center gap-2">
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-32"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEdit()
                    if (e.key === "Escape") cancelEdit()
                  }}
                  autoFocus
                />
                <Button size="sm" onClick={saveEdit} className="bg-green-600 hover:bg-green-700">
                  Save
                </Button>
                <Button size="sm" variant="default" onClick={cancelEdit}>
                  Cancel
                </Button>
              </div>
            ) : (
              <>
                <span
                  className={`font-medium ${
                    // eslint-disable-next-line no-nested-ternary
                    level === 0 ? "text-blue-600" : isLeaf ? "text-green-600" : "text-gray-900"
                  }`}
                >
                  {node.name}
                </span>
                {isLeaf && (
                  <>
                    <span className="text-gray-400">-</span>
                    {isEditingPrice ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-20"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEdit()
                            if (e.key === "Escape") cancelEdit()
                          }}
                          autoFocus
                        />
                        <span className="text-gray-600">{currency}</span>
                        <Button
                          size="sm"
                          onClick={saveEdit}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Save
                        </Button>
                        <Button size="sm" variant="default" onClick={cancelEdit}>
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <span className="text-gray-600">
                        {node.price} {currency}
                      </span>
                    )}
                  </>
                )}
              </>
            )}
          </div>

          {/* Actions */}
          <div className="cursor-pointer flex items-center gap-1 transition-opacity duration-200">

          {!isEditingName && !isEditingPrice && (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => startEdit(path, "name", node.name)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  Rename
                </Button>
                {isLeaf && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => startEdit(path, "price", node.price!)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    Edit Price
                  </Button>
                )}
                {!isLeaf && (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowAddSubcategory(pathId)}
                      className="text-green-600 hover:text-green-700"
                    >
                      + Category
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowAddService(pathId)}
                      className="text-green-600 hover:text-green-700"
                    >
                      + Service
                    </Button>
                  </>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setDeleteModal(pathId)}
                  className="text-red-600 hover:text-red-700"
                >
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="ml-4">
            {Object.entries(node.children!).map(([childKey, childNode]) =>
              renderTreeItem(childKey, childNode, [...path, childKey], level + 1),
            )}
          </div>
        )}
      </div>
    )
  }

  /** ---------------- MAIN RENDER ---------------- */

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-medium text-gray-900">Categories & Services</h4>
        <Button
          onClick={() => setShowAddCategory(true)}
          size="sm"
          className="bg-green-600 hover:bg-green-700"
        >
          + Add Category
        </Button>
      </div>

      <div className="border border-gray-200 rounded-lg p-4 max-h-96 overflow-auto">
        {Object.entries(priceList).map(([key, node]) => renderTreeItem(key, node, [key]))}
        {Object.keys(priceList).length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No categories found. Add a category to get started.
          </div>
        )}
      </div>

      {/* Add Category Dialog */}
      {showAddCategory && (
        <div className="fixed inset-0 bg-black/30 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Category</h3>
            <Input
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Category name..."
              className="w-full mb-4"
              onKeyDown={(e) => {
                if (e.key === "Enter") addCategory()
                if (e.key === "Escape") setShowAddCategory(false)
              }}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button variant="default" onClick={() => setShowAddCategory(false)}>
                Cancel
              </Button>
              <Button onClick={addCategory} className="bg-blue-600 hover:bg-blue-700">
                Add Category
              </Button>
            </div>
          </div>
        </div>
      )}
      {showAddSubcategory && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg">
            <h3>Add Subcategory</h3>
            <Label className="my-2"></Label>
            <Input
              value={newSubcategoryName}
              onChange={(e) => setNewSubcategoryName(e.target.value)}
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-4">
              <Button onClick={() => setShowAddSubcategory(null)}>Cancel</Button>
              <Button onClick={addSubcategory}>Add</Button>
            </div>
          </div>
        </div>
      )}

      {showAddService && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg">
            <h3>Add Service</h3>
            <Label className="my-2">Service name:</Label>
            <Input
              value={newServiceName}
              placeholder="Tooth removing"
              onChange={(e) => setNewServiceName(e.target.value)}
              autoFocus
            />
            <Label className="my-2">Service price:</Label>
            <Input
              type="number"
              value={newServicePrice === 0 ? "" : newServicePrice}
              placeholder="100"
              onChange={(e) => {
                const value = e.target.value;
                setNewServicePrice(value === "" ? 0 : Number(value));
              }}
            />
            <div className="flex justify-end gap-2 mt-4">
              <Button onClick={() => setShowAddService(null)}>Cancel</Button>
              <Button onClick={addService}>Add</Button>
            </div>
          </div>
        </div>
      )}


      {/* Delete confirm dialog */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg max-w-sm w-full">
            <h3 className="text-lg font-medium mb-4">Confirm Delete</h3>
            <p className="mb-6 text-gray-600">
              Are you sure you want to delete <b>{deleteModal}</b>?
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="default" onClick={() => setDeleteModal(null)}>
                Cancel
              </Button>
              <Button className="bg-red-600 hover:bg-red-700" onClick={confirmDeleteItem}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
