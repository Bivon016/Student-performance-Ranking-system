package com.gradingSystem.GraadingSystem.dataStructures;

public class StudentArray {
    public Student[] data;
    private int size;

    public StudentArray(int capacity) {
        data = new Student[capacity];
        size = 0;
    }

    public void add(Student s) {
        //increase the size of the array if full
        if (size >= data.length) {
            Student[] temp = new Student[data.length * 2];
            for (int i = 0; i < data.length; i++) temp[i] = data[i];
            data = temp;
        }
        data[size++] = s;
    }

    //get students from the array and ensure they are inbound
    public Student get(int index) {
        if (index < 0 || index >= size) throw new IndexOutOfBoundsException();
        return data[index];
    }

    public int size() {
        return size;
    }

    public Student[] getAll() {
        Student[] result = new Student[size];
        for (int i = 0; i < size; i++) result[i] = data[i];
        return result;
    }
}
