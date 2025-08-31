"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Trash2, Edit, UserPlus } from "lucide-react"
import type { Doctor } from "@/lib/types";

export default function Doctors() {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({ name: "", specialization: "" })

  // Load doctors on component mount
  useEffect(() => {
    const loadDoctors = async () => {
      try {
        const doctorsData = await window.electron.getDoctors()
        setDoctors(doctorsData)
      } catch (error) {
        console.error("Error loading doctors:", error)
      } finally {
        setLoading(false)
      }
    }
    loadDoctors()
  }, [])

  // Save doctors after any changes
  const updateDoctorsList = async (updatedDoctors: Doctor[]) => {
    setDoctors(updatedDoctors)
    await window.electron.saveDoctors(updatedDoctors)
  }

  // Add new doctor
  const handleAddDoctor = async () => {
    if (!formData.name.trim() || !formData.specialization.trim()) return

    const newDoctor: Doctor = {
      id: Date.now().toString(),
      name: formData.name.trim(),
      specialization: formData.specialization.trim(),
    }

    const updatedDoctors = [...doctors, newDoctor]
    await updateDoctorsList(updatedDoctors)

    setFormData({ name: "", specialization: "" })
    setIsDialogOpen(false)
  }

  // Edit existing doctor
  const handleEditDoctor = async () => {
    if (!editingDoctor || !formData.name.trim() || !formData.specialization.trim()) return

    const updatedDoctors = doctors.map((doctor) =>
      doctor.id === editingDoctor.id
        ? { ...doctor, name: formData.name.trim(), specialization: formData.specialization.trim() }
        : doctor,
    )

    await updateDoctorsList(updatedDoctors)

    setEditingDoctor(null)
    setFormData({ name: "", specialization: "" })
    setIsDialogOpen(false)
  }

  // Delete doctor
  const handleDeleteDoctor = async (doctorId: string) => {
    const updatedDoctors = doctors.filter((doctor) => doctor.id !== doctorId)
    await updateDoctorsList(updatedDoctors)
  }

  // Open dialog for adding new doctor
  const openAddDialog = () => {
    setEditingDoctor(null)
    setFormData({ name: "", specialization: "" })
    setIsDialogOpen(true)
  }

  // Open dialog for editing doctor
  const openEditDialog = (doctor: Doctor) => {
    setEditingDoctor(doctor)
    setFormData({ name: doctor.name, specialization: doctor.specialization })
    setIsDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading doctors...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-balance">Doctors Management</h1>
          <p className="text-muted-foreground mt-2">Manage your dental practice doctors</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAddDialog} className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Add Doctor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingDoctor ? "Edit Doctor" : "Add New Doctor"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Doctor Name</Label>
                <Input
                  id="name"
                  placeholder="Enter doctor's full name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="specialization">Specialization</Label>
                <Input
                  id="specialization"
                  placeholder="Enter specialization"
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={editingDoctor ? handleEditDoctor : handleAddDoctor}
                  className="flex-1"
                  disabled={!formData.name.trim() || !formData.specialization.trim()}
                >
                  {editingDoctor ? "Update Doctor" : "Add Doctor"}
                </Button>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {doctors.map((doctor) => (
          <Card key={doctor.id} className="relative">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{doctor.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{doctor.specialization}</p>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditDialog(doctor)}
                  className="flex items-center gap-1 flex-1"
                >
                  <Edit className="h-3 w-3" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteDoctor(doctor.id)}
                  className="flex items-center gap-1 flex-1"
                >
                  <Trash2 className="h-3 w-3" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {doctors.length === 0 && (
        <div className="text-center py-12">
          <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No doctors found</h3>
          <p className="text-muted-foreground mb-4">Get started by adding your first doctor</p>
          <Button onClick={openAddDialog}>Add First Doctor</Button>
        </div>
      )}
    </div>
  )
}
