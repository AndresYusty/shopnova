package com.shopnova.catalog.product;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ProductoRepository extends JpaRepository<Producto, Long> {

    /** Consulta parametrizada (JPQL): inmune a inyección SQL. */
    @Query("""
            SELECT p FROM Producto p
            WHERE (:q IS NULL OR LOWER(p.nombre) LIKE LOWER(CONCAT('%', :q, '%'))
                              OR LOWER(p.descripcion) LIKE LOWER(CONCAT('%', :q, '%')))
              AND (:categoria IS NULL OR LOWER(p.categoria) = LOWER(:categoria))
            """)
    Page<Producto> buscar(@Param("q") String q, @Param("categoria") String categoria, Pageable pageable);

    /** SELECT ... FOR UPDATE: serializa las reservas concurrentes del mismo producto (evita sobreventa). */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Producto p WHERE p.id = :id")
    Optional<Producto> findForUpdate(@Param("id") Long id);
}
