"""TIL-446  Ny tabell for de dataene som skal arkiveres

Revision ID: 2a2a61dd26dc
Revises: 31c82e4a3348
Create Date: 2014-12-19 12:22:28.513372

"""

# revision identifiers, used by Alembic.
from sqlalchemy.dialects.postgresql import JSON, ENUM

revision = '2a2a61dd26dc'
down_revision = '31c82e4a3348'

from alembic import op
import sqlalchemy as sa


def upgrade():
    arkivverdig_info_type_enums = sa.Enum("ny_sak",
                                          "ny_journalpost",
                                          name="arkivverdig_info_types")

    op.create_table('arkivverdig_info',
                    sa.Column('id', sa.Integer(), nullable=False),
                    sa.Column('soknad_id', sa.Integer(), nullable=False),
                    sa.Column('opprettet_dato', sa.Date(), nullable=False),
                    sa.Column('sendt_til_arkivet', sa.Boolean(), nullable=False, default=False),
                    sa.Column('type', arkivverdig_info_type_enums, nullable=False),
                    sa.Column('arkiv_metadata', JSON, nullable=False),
                    sa.ForeignKeyConstraint(['soknad_id'], ['soknader.id'], ),
                    sa.PrimaryKeyConstraint('id')
    )


def downgrade():
    op.drop_table('utbetalinger')
    ENUM(name="arkivverdig_info_types").drop(op.get_bind(), checkfirst=False)
